import axios from "axios";
import SummaryApi , { baseURL } from "../common/SummaryApi";

const Axios = axios.create({
    baseURL : baseURL,
    withCredentials : true
})

// ✅ REQUEST INTERCEPTOR
Axios.interceptors.request.use(
    async(config)=>{
        const accessToken = localStorage.getItem('accessToken')

        if(accessToken){
            config.headers.Authorization = `Bearer ${accessToken}`
        }

        return config
    },
    (error)=>{
        return Promise.reject(error)
    }
)


// ❗ RESPONSE INTERCEPTOR
Axios.interceptors.response.use(
    (response)=>{
        return response
    },
    async(error)=>{
        let originRequest = error.config 

        if(error?.response?.status === 401 && !originRequest.retry){
            // Check for force logout signal from backend (e.g., account inactivated)
            if (error.response.data?.forceLogout) {
                localStorage.clear();
                window.location.href = "/login";
                return Promise.reject(error);
            }

            originRequest.retry = true

            const refreshToken = localStorage.getItem("refreshToken")

            if(refreshToken){
                const newAccessToken = await refreshAccessToken(refreshToken)

                if(newAccessToken){
                    originRequest.headers.Authorization = `Bearer ${newAccessToken}`
                    return Axios(originRequest)
                }
            } else {
                // No refresh token found, do not force login for guests, just reject the request error
                return Promise.reject(error);
            }
        }
        
        return Promise.reject(error)
    }
)


// 🔁 REFRESH TOKEN FUNCTION
const refreshAccessToken = async(refreshToken)=>{
    try {
        const response = await axios({
            ...SummaryApi.refreshToken,
            baseURL : baseURL,
            headers : {
                Authorization : `Bearer ${refreshToken}`
            }
        })

        const accessToken = response.data.data.accessToken
        localStorage.setItem('accessToken',accessToken)
        return accessToken
    } catch (error) {
        console.error("Token refresh failed:", error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return null;
    }
}


export default Axios;