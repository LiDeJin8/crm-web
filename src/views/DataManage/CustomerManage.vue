<template>
  <div class="container-box">
    <div class="select-box">
      <span>筛选：</span>
      <el-select
        v-model="selectedItem"
        placeholder="Select"
        style="width: 240px; margin-left: 20px"
        @change="clearSelectedItem()"
      >
        <el-option
          v-for="item in selectCondition"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>

      <el-date-picker
        v-model="checkedValue"
        :type="selectedItem"
        range-separator="至"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        placeholder="请选择统计时间"
        v-if="selectedItem !== 'day' && selectedItem !== 'week'"
        style="margin-left: 20px"
        unlink-panels
        :disabled-date="disableFutureDates"
      />

      <div v-if="selectedItem !== 'day' && selectedItem === 'week'">
        <el-date-picker
          v-model="startWeekValue"
          :type="selectedItem"
          format="[第] ww [周]"
          placeholder="请选择开始周"
          style="margin-left: 20px"
          :disabled-date="disableFutureDates"
        />
        <span style="margin-left: 20px">至</span>
        <el-date-picker
          v-model="endWeekValue"
          :type="selectedItem"
          format="[第] ww [周]"
          placeholder="请选择结束周"
          style="margin-left: 20px"
          :disabled-date="disableEndWeekDates"
        />
      </div>

      <el-button type="primary" @click="getStatisData" style="margin-left: 20px">搜索</el-button>
    </div>

    <div style="height: 80vh; width: 100%">
      <CustomerDataChart :data="tradeData || {}" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import CustomerDataChart from './components/CustomerDataChart.vue'
import { CustomerApi } from '@/api/modules/customer'
import { TradeArray } from '@/api/interface'
import moment from 'moment'
import { getFormattedDateRange } from '@/hooks/useMergeTime'
import { ElMessage } from 'element-plus'

const selectedItem = ref('day')
const checkedValue = ref<Array<Date>>([])
const startWeekValue = ref<Date>()
const endWeekValue = ref<Date>()

const selectCondition = ref([
  { label: '日客户数据统计', value: 'day' },
  { label: '周客户数据统计', value: 'week' },
  { label: '月客户数据统计', value: 'monthrange' },
  { label: '自定义时间客户数据统计', value: 'daterange' }
])

const tradeData = ref<TradeArray>({ timeList: [], countList: [] })

interface TradeResponse extends IResponse {
  data: TradeArray
}
interface TradeParams {
  transactionType: string
  timeRange?: [string, string]
}

const initData = async () => {
  try {
    const res = (await CustomerApi.trendData({ transactionType: selectedItem.value })) as TradeResponse
    tradeData.value = res.data
  } catch (error) {
    console.error('获取客户统计数据失败:', error)
  }
}

onMounted(() => {
  initData()
})

const disableFutureDates = (time: Date) => {
  const now = Date.now()
  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)
  return time.getTime() > endOfToday.getTime()
}

const disableEndWeekDates = (date: Date) => {
  if (!startWeekValue.value) return date > new Date()
  const start = new Date(startWeekValue.value)
  return date < start || date > new Date()
}

const clearSelectedItem = () => {
  checkedValue.value = []
  startWeekValue.value = undefined
  endWeekValue.value = undefined
}

const getStatisData = async () => {
  try {
    let param: TradeParams = { transactionType: selectedItem.value }

    if (
      (checkedValue.value.length === 0 &&
        (selectedItem.value === 'daterange' || selectedItem.value === 'monthrange')) ||
      (startWeekValue.value === undefined &&
        endWeekValue.value === undefined &&
        selectedItem.value === 'week')
    ) {
      ElMessage({ type: 'warning', message: '请选择有效的时间范围' })
      return
    }

    if (selectedItem.value === 'monthrange') {
      const [start, end] = checkedValue.value
      const startMonth = moment(start).format('YYYY-MM-01 00:00:00')
      const endMonth = moment(end).endOf('month').format('YYYY-MM-DD 23:59:59')
      param = { ...param, timeRange: [startMonth, endMonth] }
    } else if (selectedItem.value === 'daterange') {
      const [start, end] = checkedValue.value
      const startDay = moment(start).format('YYYY-MM-DD 00:00:00')
      const endDay = moment(end).format('YYYY-MM-DD 23:59:59')
      param = { ...param, timeRange: [startDay, endDay] }
    } else if (selectedItem.value === 'week') {
      if (startWeekValue.value instanceof Date && endWeekValue.value instanceof Date) {
        const [startWeek] = getFormattedDateRange(startWeekValue.value)
        const [, endWeek] = getFormattedDateRange(endWeekValue.value)
        param = { ...param, timeRange: [startWeek, endWeek] }
      } else {
        console.warn('请选择有效的周时间')
        return
      }
    }

    const res = (await CustomerApi.trendData(param)) as TradeResponse
    tradeData.value = res.data
  } catch (error) {
    console.error('获取交易统计数据失败:', error)
  }
}
</script>

<style>
.container-box {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  height: 100%;
}
.select-box {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 5vh;
}
</style>