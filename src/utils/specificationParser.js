/**
 * Utility to parse product specifications into point-wise structured items.
 * Handles:
 *  - Inline numbered points: "1) Product Name: ... 2) Quantity: ..." or "1. ... 2. ..."
 *  - Line break separated points: "1) ... \n 2) ..." or "• ... \n • ..."
 *  - Bulleted points (- / • / *)
 *  - Semicolon-separated pairs: "Brand: X; Category: Y"
 *  - Single strings or key-value strings
 */

export function parseSpecificationPoints(rawVal) {
  if (rawVal == null) return []
  if (Array.isArray(rawVal)) {
    return rawVal
      .map((item, idx) =>
        typeof item === "string"
          ? formatPoint(item)
          : formatPoint(JSON.stringify(item), `${idx + 1})`)
      )
      .filter((p) => p.value || p.label)
  }
  if (typeof rawVal === "object") {
    return Object.entries(rawVal)
      .filter(([, v]) => v !== "" && v != null)
      .map(([k, v], idx) => ({
        prefix: `${idx + 1})`,
        label: k.replace(/:\s*$/, ""),
        value: String(v).trim(),
        raw: `${k}: ${v}`
      }))
  }

  const str = String(rawVal).trim()
  if (!str) return []

  // 1. Check if string has explicit newlines
  if (str.includes("\n")) {
    const lines = str
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
    if (lines.length > 1) {
      return lines.map((line) => formatPoint(line))
    }
  }

  // 2. Check if string has inline numbered / bullet points: 1) ... 2) ... or 1. ... 2. ...
  const inlineNumberedRegex = /(?:^|\s+)(?:(\d+)[\.\)]|(?:\((\d+)\))|(?:\[(\d+)\])|([•\-\*]))\s+/g
  const matches = [...str.matchAll(inlineNumberedRegex)]

  if (matches.length > 1) {
    const points = []
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i]
      const start = match.index + match[0].length
      const end = i + 1 < matches.length ? matches[i + 1].index : str.length
      const text = str.substring(start, end).trim()
      const num = match[1] || match[2] || match[3]
      const bullet = match[4]
      const prefix = num ? `${num})` : (bullet || "•")
      points.push(formatPoint(text, prefix))
    }
    return points
  }

  // 3. Check if separated by semicolons with key: value pairs
  if (str.includes(";")) {
    const parts = str.split(";").map((s) => s.trim()).filter(Boolean)
    if (parts.length > 1 && parts.some((p) => p.includes(":"))) {
      return parts.map((p, idx) => formatPoint(p, `${idx + 1})`))
    }
  }

  // Single item fallback
  return [formatPoint(str, "")]
}

export function formatPoint(text, explicitPrefix = "") {
  let cleanText = String(text || "").trim()
  let prefix = explicitPrefix

  // Extract leading bullet or number if present (e.g. "1) ...", "1. ...", "- ...", "• ...")
  const leadMatch = cleanText.match(/^((?:\d+[\.\)]|\(\d+\)|\[\d+\]|[•\-\*]))\s+(.*)$/)
  if (leadMatch) {
    if (!prefix) prefix = leadMatch[1]
    cleanText = leadMatch[2].trim()
  }

  // Check if point has "Key: Value" (limit key length to 45 chars to avoid long sentences with colons)
  const colonIndex = cleanText.indexOf(":")
  if (colonIndex > 0 && colonIndex < 45) {
    const label = cleanText.substring(0, colonIndex).trim()
    const value = cleanText.substring(colonIndex + 1).trim()
    return { prefix, label, value, raw: text }
  }

  return { prefix, label: "", value: cleanText, raw: text }
}

