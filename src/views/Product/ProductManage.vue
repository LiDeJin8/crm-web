<template>
  <div class="table-box">
    <ProTable
      ref="proTable"
      title="商品列表"
      :columns="columns"
      :requestApi="ProductApi.page"
      :initParam="initParam"
      :dataCallback="dataCallback"
      :searchCol="{ xs: 2, sm: 3, md: 4, lg: 6, xl: 8 }"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader>
        <el-button
          type="primary"
          :icon="CirclePlus"
          v-hasPermi="['sys:product:add']"
          @click="openDrawer('新增')"
        >
          新增
        </el-button>
      </template>

       <!-- 表格操作 -->
      <template #operation="scope">
        <el-button
          type="primary"
          link
          :icon="EditPen"
          v-hasPermi="['sys:product:edit']"
          @click="openDrawer('编辑', scope.row)"
        >
          编辑
        </el-button>
        <el-button
          type="success"
          link
          :icon="EditPen"
          v-hasPermi="['sys:product:up']"
          @click="openStateDialog('商品上架', scope.row)"
          v-if="scope.row.status !== 1"
        >
          商品上架
        </el-button>
        <el-button
          type="danger"
          link
          :icon="EditPen"
          v-hasPermi="['sys:product:down']"
          @click="openStateDialog('商品下架', scope.row)"
          v-if="scope.row.status === 1"
        >
          商品下架
        </el-button>

        <!-- <el-button
          type="danger"
          link
          :icon="Delete"
          v-hasPermi="['sys:product:remove']"
          @click="handleDelete([scope.row.id])"
        >
          删除
        </el-button> -->
      </template>
    </ProTable>

    <!-- 新增/编辑/查看弹窗 -->
    <ProductDialog ref="dialogRef" />
    <ProductStateDialog ref="stateDialogRef" />
  </div>
</template>

<script setup lang="ts" name="ProductManage">
import { ref, reactive } from 'vue'
import type { ColumnProps } from '@/components/ProTable/interface'
import ProTable from '@/components/ProTable/index.vue'
import ProductDialog from './components/ProductDialog.vue'
import { ProductApi } from '@/api/modules/product'
import { ProductStatusList } from '@/configs/enum'
import { CirclePlus, EditPen } from '@element-plus/icons-vue'
import ProductStateDialog from './components/ProductStateDialog.vue'



/* ProTable 实例 */
const proTable = ref()

/* 默认请求参数 */
const initParam = reactive({ isPublic: 1 })
const dataSize= ref(0)
/* 后台字段映射 */
const dataCallback=(data:any)=>{
    dataSize.value=data.list.size
    return{
        list:data.list,
        total:data.total
    }
}

/* 表格列配置 */
const columns: ColumnProps[] = [
  { type: 'selection', fixed: 'left', width: 60 },
  { prop: 'name', label: '商品名称', minWidth: 150, search: { el: 'input' } },
  { prop: 'price', label: '价格', minWidth: 120 },
  { prop: 'sales', label: '销量', minWidth: 120 },
  { prop: 'stock', label: '库存数量', minWidth: 120 },
  { prop: 'status', label: '商品状态', minWidth: 120, enum: Object.values(ProductStatusList), search: { el: 'select' } },
  { prop: 'createTime', label: '创建时间', width: 200 },
  { prop: 'operation', label: '操作', fixed: 'right', width: 230 }
]

/* 打开弹窗（新增 | 编辑 | 查看） */
const dialogRef = ref<InstanceType<typeof ProductDialog>>()
const openDrawer = (title: string, row: any = {}) => {
  dialogRef.value?.acceptParams({
    title,
    row: { ...row },
    isView: title === '查看',
    api: title === '新增' || title === '编辑' ? ProductApi.saveOrEdit : undefined,
    getTableList: proTable.value?.getTableList,
    maxHeight: '300px'
  })
}

const stateDialogRef = ref()
const openStateDialog = (title: string, row: any = {}) => {
  let params = {
    title,
    row: { ...row },
    isView: title === '查看',
    api:ProductApi.saveOrEdit,
    getTableList: proTable.value?.getTableList,
    maxHeight: '150px'
  }
  
stateDialogRef.value.acceptParams(params)
}

/* 删除（单条/批量） */
/* const handleDelete = (ids: number[]) => {
  ElMessageBox.confirm('确认删除选中的数据？', '提示', { type: 'warning' })
    .then(async () => {
      await ProductApi.remove(ids)
      ElMessage.success('删除成功')
      proTable.value?.getTableList()
    })
    .catch(() => {})
} */
</script>