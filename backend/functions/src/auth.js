// Returns the caller's user id, or null.
// DEV_AUTH=true trusts an x-dev-user header for local testing, and is refused in the cloud.
async function getUid(req) {
  if (process.env.DEV_AUTH === "true") {
    if (process.env.NODE_ENV === "production" || process.env.K_SERVICE || process.env.FUNCTION_TARGET) {
      throw new Error("DEV_AUTH must not be enabled in production");
    }
    return req.get("x-dev-user") || null;
  }
  const h = req.get("authorization") || "";
  if (!h.startsWith("Bearer ")) return null;
  try {
    const { getApps, initializeApp } = require("firebase-admin/app");
    const { getAuth } = require("firebase-admin/auth");
    if (!getApps().length) initializeApp(); // uses the project's own credentials when deployed
    return (await getAuth().verifyIdToken(h.slice(7))).uid;
  } catch {
    return null;
  }
}
module.exports = { getUid };
