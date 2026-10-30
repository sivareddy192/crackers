export const getDiscountPercent = (mrp, price) => {
    const originalPrice = Number(mrp)
    const sellingPrice = Number(price)

    if (!Number.isFinite(originalPrice) || !Number.isFinite(sellingPrice) || originalPrice <= 0) {
        return 0
    }

    return Math.min(100, Math.max(0, Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)))
}