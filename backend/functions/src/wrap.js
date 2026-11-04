const { query } = require("./db");
const { getUid } = require("./auth");

const bad = (msg, status = 400) => { throw Object.assign(new Error(msg), { status }); };

// Authenticates, loads the caller's row, sends the returned object as JSON, maps errors to status codes.
const route = (fn, { needUser = true } = {}) => async (req, res) => {
  try {
    const uid = await getUid(req);
    if (!uid) return res.status(401).json({ error: "unauthorized" });
    const me = (await query("select * from users where uid=$1", [uid])).rows[0] || null;
    if (needUser && !me) return res.status(404).json({ error: "no profile" });
    const out = await fn(req, me, uid);
    if (out !== undefined && !res.headersSent) res.json(out);
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500) console.error(e);
    res.status(status).json({ error: status >= 500 ? "Server error" : e.message });
  }
};
module.exports = { route, bad };
