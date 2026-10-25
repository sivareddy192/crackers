import { baseURL } from "../common/SummaryApi";

export const getImageUrl = (image) => {
    if (!image) return "/placeholder.png";

    let url = "";

    if (Array.isArray(image)) {
        url = image[0];
    } else if (typeof image === "object") {
        url = image?.secure_url || image?.url || "/placeholder.png";
    } else if (typeof image === "string") {
        url = image.trim();
    }

    if (!url || url === "/placeholder.png") return "/placeholder.png";

    // ✅ Fix Mixed Content: Force HTTPS for Cloudinary and other external links
    if (url.startsWith("http://")) {
        url = url.replace("http://", "https://");
    }

    // If it's a relative path, prepend the API base URL
    if (!url.startsWith("http") && !url.startsWith("data:")) {
        const base = baseURL || "";
        url = url.startsWith("/") ? `${base}${url}` : `${base}/${url}`;
        
        // Ensure the constructed URL is also HTTPS if the base was HTTP
        if (url.startsWith("http://")) {
            url = url.replace("http://", "https://");
        }
    }

    return url;
};
