/**
 * Optimizes image URLs for highest performance and lowest byte delivery.
 * - Leaves local/frontend static assets (/assets/..., /vite.jpg, /placeholder.png) untouched.
 * - Forces HTTPS to eliminate mixed-content security warnings.
 * - Injects Cloudinary auto-format (f_auto) and perceptual auto-compression (q_auto).
 * - Implements width bounding (c_limit, w_<targetWidth>) so images are never oversized.
 * - Handles arrays, objects, and empty/missing image data safely.
 */
export const getImageUrl = (image, { width, quality = "auto" } = {}) => {
    if (!image) return "/placeholder.png";

    let url = "";

    if (Array.isArray(image)) {
        const first = image[0];
        url = typeof first === "string" ? first : (first?.secure_url || first?.url || "");
    } else if (typeof image === "object" && image !== null) {
        url = image.secure_url || image.url || image.path || "";
    } else if (typeof image === "string") {
        url = image.trim();
    }

    if (!url || url === "placeholder.png" || url === "/placeholder.png") {
        return "/placeholder.png";
    }

    // Local frontend static assets must be served from the frontend origin, never the API server
    if (url.startsWith("/") || url.startsWith("./") || url.startsWith("data:") || url.startsWith("blob:")) {
        return url;
    }

    // Fix Mixed Content: Force HTTPS for Cloudinary and other external links
    if (url.startsWith("http://")) {
        url = url.replace("http://", "https://");
    }

    // If it's a Cloudinary URL, optimize transformations
    if (url.includes("res.cloudinary.com")) {
        try {
            const parsedUrl = new URL(url);
            if (parsedUrl.hostname === "res.cloudinary.com") {
                const pathSegments = parsedUrl.pathname.split("/");
                const uploadIndex = pathSegments.indexOf("upload");

                if (uploadIndex !== -1) {
                    const nextIndex = uploadIndex + 1;
                    const nextSegment = pathSegments[nextIndex] || "";

                    // A segment is a version if it starts with 'v' followed only by digits (e.g. v1712345678)
                    const isVersion = /^v\d+$/.test(nextSegment);

                    // A segment is an existing transformation if it contains transformation keys and isn't a version
                    const hasTransformKey = /(^|,)(a|b|c|dpr|e|f|fl|g|h|l|o|q|r|t|u|w|x|y|z)_/.test(nextSegment);
                    const isTransform = hasTransformKey && !isVersion;

                    const targetWidth = Number(width);
                    const hasValidWidth = Number.isFinite(targetWidth) && targetWidth > 0;

                    // Collect and clean existing transforms
                    const existingParts = isTransform
                        ? nextSegment.split(",").filter(part => !/^(f|q|w|c)_/.test(part))
                        : [];

                    const newTransforms = [...existingParts];
                    newTransforms.push("f_auto");
                    newTransforms.push(quality === "auto" ? "q_auto:good" : `q_${quality}`);

                    if (hasValidWidth) {
                        newTransforms.push("c_limit");
                        newTransforms.push(`w_${Math.round(targetWidth)}`);
                    }

                    const transformString = newTransforms.join(",");

                    if (isTransform) {
                        pathSegments[nextIndex] = transformString;
                    } else {
                        pathSegments.splice(nextIndex, 0, transformString);
                    }

                    parsedUrl.pathname = pathSegments.join("/");
                    return parsedUrl.toString();
                }
            }
        } catch {
            return url;
        }
    }

    return url;
};
