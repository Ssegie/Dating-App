const { Router } = require("express");
const { query, COLS } = require("../db");
const { route, bad } = require("../wrap");
const { blockUser, isUuid } = require("../safety");
const r = Router();

r.get("/blocks", route(async (req, me) => {
  const out = await query(`select ${COLS} from blocks b join users u on u.id=b.blocked where b.blocker=$1`, [me.id]);
  return { blocked: out.rows };
}));
r.post("/blocks", route(async (req, me) => {
  const { userId } = req.body || {};
  if (!isUuid(userId) || userId === me.id) bad("Invalid user.");
  if (!(await query("select 1 from users where id=$1", [userId])).rowCount) bad("User not found.", 404);
  await blockUser(me.id, userId);
  return { ok: true };
}));
r.delete("/blocks", route(async (req, me) => {
  if (!isUuid(req.query.userId)) bad("Invalid user.");
  await query("delete from blocks where blocker=$1 and blocked=$2", [me.id, req.query.userId]);
  return { ok: true };
}));
module.exports = r;
