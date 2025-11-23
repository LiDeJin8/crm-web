import http from'@/api'
import {COMMON_ADMIN_API}from'@/api/axios/servicePort'


export const ContractApi={page:(params:any)=>http.post(COMMON_ADMIN_API+'/contract/page',params),
    saveOrEdit:(params:any)=>http.post(COMMON_ADMIN_API+'/contract/saveOrUpdate',params),
    startApproval:(params:any)=>http.post(COMMON_ADMIN_API+'/contract/startApproval',params),
    approvalContract:(params:any)=>http.post(COMMON_ADMIN_API+'/contract/approvalContract',params)

}