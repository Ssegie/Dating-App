// Returns "approved" | "pending" | "rejected" for an uploaded JPEG buffer.
// MODERATION=off    -> everything approved (local development).
// MODERATION=vision -> Google Cloud Vision SafeSearch (needs GOOGLE_VISION_KEY). Fails closed:
//                      if the check cannot run, the photo stays "pending" and is shown to nobody.
const BAD = ["LIKELY", "VERY_LIKELY"];
async function moderate(buf) {
  if (process.env.MODERATION !== "vision") return "approved";
  const key = process.env.GOOGLE_VISION_KEY;
  if (!key) return "pending";
  try {
    const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${key}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ requests: [{ image: { content: buf.toString("base64") }, features: [{ type: "SAFE_SEARCH_DETECTION" }] }] }),
    });
    if (!res.ok) return "pending";
    const s = (await res.json()).responses?.[0]?.safeSearchAnnotation;
    if (!s) return "pending";
    if (BAD.includes(s.adult) || BAD.includes(s.violence)) return "rejected";
    if (s.racy === "VERY_LIKELY") return "pending";
    return "approved";
  } catch { return "pending"; }
}
module.exports = { moderate };
