<template>
  <div class="table-box">
    <ProTable
      ref="proTable"
      title="合同列表"
      :columns="columns"
      :requestApi="ContractApi.page"
      :initParam="initParam"
      :dataCallback="dataCallback"
      :searchCol="{ xs: 2, sm: 3, md: 4, lg: 6, xl: 8 }"
    >
      <template #operation="scope">        
        <el-button 
          type="success" link 
          :icon="CircleCheckFilled" 
          v-hasPermi="['sys:contract:pass']" 
          @click="openApprovalDialog(scope.row, 0)"
        >
          审核通过
        </el-button> 
        <el-button 
          type="danger" link 
          :icon="CircleCloseFilled" 
          v-hasPermi="['sys:contract:reject']" 
          @click="openApprovalDialog(scope.row, 1)"
        >
          审核不通过
        </el-button>  
      </template>
    </ProTable>

    <el-dialog v-model="visible" title="填写审核意见">
      <el-input
        v-model="comment"
        type="textarea"
        placeholder="请输入审核意见"
        rows="4"
      />
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="submitApproval">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ColumnProps } from '@/components/ProTable/interface'
import ProTable from '@/components/ProTable/index.vue'
import { ContractApi } from '@/api/modules/contract'
import { ContractStatusList } from '@/configs/enum'
import { CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue' 
import { useHandleData } from '@/hooks/useHandleData'

const visible = ref(false)
const comment = ref('')
let approvalRow: any = null
let approvalType = 0

const proTable = ref()
const initParam = reactive({ status: 1 })
const dataCallback = (data: any) => ({
  list: data.list,
  total: data.total
})

const columns: ColumnProps[] = [
  { type:'selection', fixed:'left', width:60 },
  { prop:'name', label:'合同名称', minWidth:120, search:{ el:'input' } },
  { prop:'number', label:'合同编号', minWidth:120, search:{ el:'input' } },
  { prop:'customerName', label:'客户姓名', minWidth:120, search:{ el:'input' } },
  { prop:'salesEmail', label:'销售邮箱', minWidth:180 }, // 显示销售邮箱
  { prop:'amount', label:'合同金额', minWidth:100 },
  { prop:'receivedAmount', label:'已收到款项', minWidth:140 },
  { prop:'status', label:'合同状态', minWidth:120, enum:Object.values(ContractStatusList), search:{ el:'select' } },
  { prop:'signTime', label:'签约时间', minWidth:140 },
  { prop:'startTime', label:'合同开始时间', minWidth:140 },
  { prop:'endTime', label:'合同结束时间', minWidth:140 },
  { prop:'operation', label:'操作', fixed:'right', width:330 }
]

// 打开审核对话框
const openApprovalDialog = (row: any, type: number) => {
  approvalRow = row
  approvalType = type
  comment.value = ''
  visible.value = true
}

// 提交审核
const submitApproval = async () => {
  if (!approvalRow) return
  await useHandleData(
    ContractApi.approvalContract,
    { id: approvalRow.id, type: approvalType, comment: comment.value },
    approvalType === 0 ? '合同审核通过' : '合同审核不通过'
  )
  visible.value = false
  proTable.value.getTableList()
}
</script>
