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

    if (url.startsWith("/") || url.startsWith("./") || url.startsWith("data:") || url.startsWith("blob:")) {
        return url;
    }

    if (url.startsWith("http://")) {
        url = url.replace("http://", "https://");
    }

    if (url.includes("res.cloudinary.com")) {
        try {
            const parsedUrl = new URL(url);
            if (parsedUrl.hostname === "res.cloudinary.com") {
                const pathSegments = parsedUrl.pathname.split("/");
                const uploadIndex = pathSegments.indexOf("upload");

                if (uploadIndex !== -1) {
                    const nextIndex = uploadIndex + 1;
                    const nextSegment = pathSegments[nextIndex] || "";

                    const isVersion = /^v\d+$/.test(nextSegment);

                    const hasTransformKey = /(^|,)(a|b|c|dpr|e|f|fl|g|h|l|o|q|r|t|u|w|x|y|z)_/.test(nextSegment);
                    const isTransform = hasTransformKey && !isVersion;

                    // Default max-dimension cap of 600px prevents multi-megabyte unscaled images
                    const targetWidth = Number(width) || (width === null ? null : 600);
                    const hasValidWidth = Number.isFinite(targetWidth) && targetWidth > 0;

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
