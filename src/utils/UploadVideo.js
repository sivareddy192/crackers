import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'

const uploadVideo = async (video) => {
    if (!video) {
        throw new Error("No video file provided");
    }

    const formData = new FormData()
    formData.append('video', video)

    const response = await Axios({
        ...SummaryApi.uploadVideo,
        data: formData
    })

    if (!response?.data) {
        throw new Error("Invalid response received from upload server");
    }

    if (response.data.success === false) {
        throw new Error(response.data.message || "Video upload failed");
    }

    return response
}

export default uploadVideo
