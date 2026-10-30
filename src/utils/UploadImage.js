import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'

const uploadImage = async (image) => {
    if (!image) {
        throw new Error("No image file provided");
    }

    const formData = new FormData()
    formData.append('image', image)

    const response = await Axios({
        ...SummaryApi.uploadImage,
        data: formData
    })

    if (!response?.data) {
        throw new Error("Invalid response received from upload server");
    }

    if (response.data.success === false) {
        throw new Error(response.data.message || "Image upload failed");
    }

    return response
}

export default uploadImage
