import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'

const uploadVideo = async(video)=>{
    try {
        const formData = new FormData()
        formData.append('video',video)

        const response = await Axios({
            ...SummaryApi.uploadVideo,
            data : formData
        })

        return response
    } catch (error) {
        return error
    }
}

export default uploadVideo
