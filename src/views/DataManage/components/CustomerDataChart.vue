<template>
  <div class="sales-report">
    <!-- 上方卡片区 -->
    <el-row :gutter="20" class="card-section" style="width:100%; padding: 0 20px; box-sizing: border-box;">
      <el-col :span="4" v-for="card in cards" :key="card.key">
        <el-card shadow="hover" class="data-card">
          <div class="card-title">{{ card.title }}</div>
          <div class="card-value">{{ formatValue(card.value, card.isAmount) }}</div>
          <div class="card-footer">
            <span>昨日 {{ formatValue(card.yesterday, card.isAmount) }}</span>
            <span :class="{ up: card.change > 0, down: card.change < 0 }">
              {{ card.change > 0 ? '↑' : card.change < 0 ? '↓' : '' }}
              {{ Math.abs(card.change).toFixed(1) }}%
            </span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 下方环形图 -->
    <div class="chart-section" style="width:100%; padding: 0 40px; box-sizing: border-box;">
      <div class="chart-header" style="margin-bottom: 10px;">
        <span>业绩进度一览图（%）</span>
        <div class="filters">
          <el-date-picker v-model="year" type="year" placeholder="选择年份" />
          <el-select v-model="month" placeholder="选择月份" @change="loadReport">
            <el-option label="全年度" value="全年" />
            <el-option v-for="m in 12" :key="m" :label="m + '月'" :value="m" />
          </el-select>
        </div>
      </div>
      <div ref="ringChart" class="ring-chart"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { CustomerApi } from '@/api/modules/customer'
import { ElMessage } from 'element-plus'
import moment from 'moment'

// 卡片数据定义（key 用于和后端字段对应）
const cards = ref([
  { key: 'newCustomer', title: '新增客户(人)', value: 0, yesterday: 0, change: 0, isAmount: false },
  { key: 'newContact', title: '新增联系人(人)', value: 0, yesterday: 0, change: 0, isAmount: false },
  { key: 'newBusiness', title: '新增商机(个)', value: 0, yesterday: 0, change: 0, isAmount: false },
  { key: 'newContract', title: '新增合同(个)', value: 0, yesterday: 0, change: 0, isAmount: false },
  { key: 'contractAmount', title: '合同金额(元)', value: 0, yesterday: 0, change: 0, isAmount: true },
  { key: 'returnAmount', title: '回款金额(元)', value: 0, yesterday: 0, change: 0, isAmount: true }
])

const year = ref<string | number>(moment().format('YYYY'))
const month = ref<string | number>('全年')

const ringChart = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

// tradeData 兼容 trendData 返回结构
const tradeData = ref<{ timeList?: string[]; countList?: number[]; [k: string]: any }>({ timeList: [], countList: [] })

// 千分位显示金额或直接显示数字
const formatValue = (v: any, isAmount = false) => {
  const n = Number(v || 0)
  if (isAmount) return n.toLocaleString()
  return n
}

// 渲染环形图（合同金额 vs 回款金额）
const renderRingChart = (contractValue = 0, returnValue = 0) => {
  if (!ringChart.value) return
  if (chartInstance) chartInstance.dispose()
  chartInstance = echarts.init(ringChart.value)
  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { top: 'bottom' },
    series: [
      {
        name: '业绩占比',
        type: 'pie',
        radius: ['60%', '80%'],
        label: { show: true, formatter: '{b}: {d}%' },
        data: [
          { value: Number(contractValue || 0), name: '合同金额' },
          { value: Number(returnValue || 0), name: '回款金额' }
        ]
      }
    ]
  }
  chartInstance.setOption(option)
}

// 将后端返回的数据映射到卡片（兼容多种返回结构）
const mapDataToCards = (data: any) => {
  // 优先使用后端直接返回的汇总字段（如果存在）
  const contractAmount = Number(data?.contractAmount ?? data?.summary?.contractAmount ?? 0)
  const returnAmount = Number(data?.returnAmount ?? data?.summary?.returnAmount ?? 0)

  // 如果后端返回 timeList/countList，则从中得出 latest/previous
  const counts: number[] = Array.isArray(data?.countList) ? data.countList.map((v: any) => Number(v || 0)) : []
  const latest = counts.length ? counts[counts.length - 1] : 0
  const prev = counts.length > 1 ? counts[counts.length - 2] : 0


  cards.value.forEach((card) => {
    // 如果后端直接返回对应 key，使用后端字段；否则使用我们推断的值
    const remoteVal = data?.[card.key] ?? data?.summary?.[card.key] ?? undefined
    const remoteYest = data?.yesterday?.[card.key] ?? data?.summary?.yesterday?.[card.key] ?? undefined

    switch (card.key) {
      case 'newCustomer':
        card.value = remoteVal !== undefined ? Number(remoteVal) : latest
        card.yesterday = remoteYest !== undefined ? Number(remoteYest) : prev
        break
      case 'contractAmount':
        card.value = remoteVal !== undefined ? Number(remoteVal) : contractAmount
        card.yesterday = remoteYest !== undefined ? Number(remoteYest) : Number(data?.yesterday?.contractAmount ?? 0)
        break
      case 'returnAmount':
        card.value = remoteVal !== undefined ? Number(remoteVal) : returnAmount
        card.yesterday = remoteYest !== undefined ? Number(remoteYest) : Number(data?.yesterday?.returnAmount ?? 0)
        break
      default:
        // 其他字段优先使用后端，否则设为0
        card.value = remoteVal !== undefined ? Number(remoteVal) : 0
        card.yesterday = remoteYest !== undefined ? Number(remoteYest) : 0
    }

    // 计算变化率，避免除以0；保证 change 为 number
    const y = Number(card.yesterday || 0)
    const v = Number(card.value || 0)
    if (y === 0) {
      card.change = (v === 0 ? 0 : 100) // 昨日 0 且今日>0 -> 显示 100%（可以按需调整）
    } else {
      card.change = Number((((v - y) / y) * 100).toFixed(1))
    }
  })

  // 更新环形图（优先后端汇总，否则尝试取counts推断）
  const cAmt = contractAmount || 0
  const rAmt = returnAmount || 0
  renderRingChart(cAmt, rAmt)
}

// 构造请求参数（如果选择某月则发 timeRange）
const buildParams = () => {
  // 这里用 transactionType='day' 作为示例 - 你可改为实际需要的值
  const params: any = { transactionType: 'day' }

  if (month.value !== '全年') {
    // 将所选 year/month 转为当月第一天 00:00:00 到 当月最后一天 23:59:59
    const m = Number(month.value)
    const start = moment(`${year.value}-${String(m).padStart(2, '0')}-01`).startOf('month').format('YYYY-MM-DD 00:00:00')
    const end = moment(`${year.value}-${String(m).padStart(2, '0')}-01`).endOf('month').format('YYYY-MM-DD 23:59:59')
    params.timeRange = [start, end]
  } else {
    // 全年可以传年份或不传，取决于后端，我这里传 year 字段（兼容）
    params.year = String(year.value)
  }

  return params
}

// 发起请求（使用 trendData）
const loadReport = async () => {
  try {
    const params = buildParams()
    const res = await CustomerApi.trendData(params)
    if (!res || !res.data) {
      ElMessage.warning('未获取到数据（返回为空）')
      tradeData.value = { timeList: [], countList: [] }
      mapDataToCards(tradeData.value)
      return
    }

    tradeData.value = res.data
    // 帮助调试：如果你的数据没有按预期，请在控制台打印一次 res.data
    // console.log('trendData res.data =', res.data)

    mapDataToCards(res.data)
  } catch (err) {
    console.error('获取统计数据失败', err)
    ElMessage.error('获取统计数据失败')
  }
}

// 初始化 & 绑定 resize
onMounted(() => {
  loadReport()
  window.addEventListener('resize', () => chartInstance?.resize())
})
onUnmounted(() => {
  window.removeEventListener('resize', () => chartInstance?.resize())
  if (chartInstance) chartInstance.dispose()
})

// 如果 year 或 month 改变则重新拉取
watch([year, month], () => loadReport())
</script>

<style scoped>
.sales-report {
  padding: 20px;
}
.card-section {
  margin-bottom: 30px;
}
.data-card {
  text-align: center;
  padding: 10px 0;
}
.card-title {
  font-size: 14px;
  color: #666;
}
.card-value {
  font-size: 24px;
  font-weight: bold;
  margin: 5px 0;
}
.card-footer {
  font-size: 12px;
  color: #999;
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
}
.up {
  color: #67c23a;
}
.down {
  color: #f56c6c;
}
.chart-section {
  margin-top: 20px;
}
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.filters {
  display: flex;
  gap: 10px;
}
.ring-chart {
  width: 100%;
  height: 350px;
}
</style>
