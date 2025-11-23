<template>
  <Dialog
    :model-value="dialogVisible"
    :title="dialogProps.title"
    :fullscreen="dialogProps.fullscreen"
    :max-height="dialogProps.maxHeight"
    :cancel-dialog="cancelDialog"
    width="50%"
  >
    <div :style="'width: calc(100% - ' + dialogProps.labelWidth! / 2 + 'px)'">
      <el-form
        ref="ruleFormRef"
        label-position="right"
        :label-width="dialogProps.labelWidth + 'px'"
        :rules="rules"
        :model="dialogProps.row"
        :disabled="dialogProps.isView"
        :hide-required-asterisk="dialogProps.isView"
      >
        <el-form-item label="线索名称" prop="name">
          <el-input
            v-model="dialogProps.row!.name"
            placeholder="请填写线索名称"
            clearable
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="线索手机号" prop="phone">
          <el-input
            v-model="dialogProps.row!.phone"
            placeholder="请填写线索手机号"
            clearable
            maxlength="11"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="线索邮箱" prop="email">
          <el-input
            v-model="dialogProps.row!.email"
            placeholder="请填写线索邮箱"
            clearable
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="线索地址" prop="address">
          <el-input
            v-model="dialogProps.row!.address"
            placeholder="请填写线索地址"
            clearable
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="线索等级" prop="level">
          <el-select
            v-model="dialogProps.row!.level"
            filterable
            placeholder="请选择线索等级"
            class="w-full"
          >
            <el-option
              v-for="item in Object.values(CustomerLevelList)"
              :key="item.value"
              :label="item.label"
              :value="item.value"
              class="isabel-option"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="线索来源" prop="source">
          <el-select
            v-model="dialogProps.row!.source"
            filterable
            placeholder="请选择线索来源"
            class="w-full"
          >
            <el-option
              v-for="item in Object.values(CustomerSourceList)"
              :key="item.value"
              :label="item.label"
              :value="item.value"
              class="isabel-option"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="跟进状态" prop="followStatus">
          <el-select
            v-model="dialogProps.row!.followStatus"
            filterable
            placeholder="请选择线索跟进状态"
            class="w-full"
          >
            <el-option
              v-for="item in Object.values(FollowUpStatusList)"
              :key="item.value"
              :label="item.label"
              :value="item.value"
              class="isabel-option"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="线索状态" prop="status" v-if="dialogProps.row!.id">
          <el-select
            v-model="dialogProps.row!.status"
            filterable
            placeholder="请选择线索状态"
            class="w-full"
          >
            <el-option
              v-for="item in Object.values(LeadStatusList)"
              :key="item.value"
              :label="item.label"
              :value="item.value"
              class="isabel-option"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <slot name="footer">
        <el-button @click="cancelDialog">取消</el-button>
        <el-button
          type="primary"
          v-show="!dialogProps.isView"
          @click="handleSubmit"
        >确定</el-button>
      </slot>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, FormInstance } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import {
  CustomerLevelList,
  CustomerSourceList,
  FollowUpStatusList,
  LeadStatusList
} from '@/configs/enum'


interface DialogProps {
  title: string
  isView: boolean
  fullscreen?: boolean
  row: any
  labelWidth?: number
  maxHeight?: number | string
  api?: (params: any) => Promise<any>
  getTableList?: () => Promise<any>
}

const dialogVisible = ref(false)
const dialogProps = ref<DialogProps>({
  isView: false,
  title: '',
  row: {},
  labelWidth: 160,
  fullscreen: false,
  maxHeight: '500px'
})

// 接收父组件传过来的参数
 const acceptParams = (params: DialogProps): void => {
  params.row = { ...dialogProps.value.row, ...params.row }
  dialogProps.value = { ...dialogProps.value, ...params }
  dialogVisible.value = true
} 


defineExpose({ acceptParams })

const rules = reactive({
  name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入客户手机号', trigger: 'blur' },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '手机号格式不正确',
      trigger: 'blur'
    }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    {
      pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
      message: '邮箱格式不正确',
      trigger: 'blur'
    }
  ],
  level: [{ required: true, message: '客户级别不能为空', trigger: 'blur' }],
  source: [{ required: true, message: '客户来源不能为空', trigger: 'blur' }],
  followStatus: [
    { required: true, message: '客户来源不能为空', trigger: 'blur' }
  ]
})

const ruleFormRef = ref<FormInstance>()
// LeadDialog.vue 中的 handleSubmit
 const handleSubmit = () => {
  console.log('handleSubmit 被点击了！');
  
  // 临时代码：强制执行 API 逻辑，排除表单校验问题
  (async () => {
    // 强制赋值 valid 为 true，跳过 ruleFormRef.value!.validate
    const valid = true; 
    
    if (!valid) return;

    // 再次确认 API 函数是否丢失 (如果这里还是 undefined，问题就更深了)
    console.log('Force Check API:', dialogProps.value.api); 
    
    try {
      // 检查 API 是否在
      if (!dialogProps.value.api) {
          throw new Error("API function is missing (dialogProps.value.api is undefined).");
      }
      
      delete dialogProps.value.row['updateTime']
      delete dialogProps.value.row['createTime']
      await dialogProps.value.api!(dialogProps.value.row)
      
      // 成功
      ElMessage.success({ message: `${dialogProps.value.title}成功！` })
      dialogProps.value.getTableList!()
      dialogVisible.value = false
      ruleFormRef.value!.resetFields()
      cancelDialog(true)

    } catch (error: any) {
        // 🚨 关键：打印出 API 错误和用户提示
        console.error('API Request Failed:', error);
        ElMessage.error({
            message: `操作失败: ${error.message || '后端请求出错或格式不正确'}`
        });
    }
  })();
} 
// ⚠️ 记得也要对 FollowDialog.vue 进行相同的临时修改！
 /* const handleSubmit = () => {
  ruleFormRef.value!.validate(async (valid) => {
    if (!valid) return
    console.log('Final Check - API in HandleSubmit:', dialogProps.value.api);
    try {
      delete dialogProps.value.row['updateTime']
      delete dialogProps.value.row['createTime']
      await dialogProps.value.api!(dialogProps.value.row)
      ElMessage.success({
        message: `${dialogProps.value.title}成功！`
      })
      dialogProps.value.getTableList!()
      dialogVisible.value = false
      ruleFormRef.value!.resetFields()
      cancelDialog(true)
    } catch (error) {
      console.log(error)
    }
  })
}  */

const cancelDialog = (isClean?: boolean) => {
  dialogVisible.value = false
  let condition = ['查看', '编辑']
  if (condition.includes(dialogProps.value.title) || isClean) {
    dialogProps.value.row = {}
    ruleFormRef.value!.resetFields()
  }
}
</script>