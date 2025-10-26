import { COMMON_ADMIN_API } from "@/api/axios/servicePort";
import http from '@/api'

export const uploadFile = (params: FormData) => {
    return http.post(COMMON_ADMIN_API + '/common/upload/file',params,{
        headers: {
            'Content-Type' : 'multipart/form-data'
        }
    })

}