const { Router } = require("express");
const { query } = require("../db");
const { route, bad } = require("../wrap");
const { blockUser, isUuid } = require("../safety");
const r = Router();

const REASONS = ["fake", "photos", "harass", "spam", "underage", "other"];
const HIDE_AT = 3; // distinct reporters before a profile is hidden pending review

r.post("/reports", route(async (req, me) => {
  const { userId, reason, block } = req.body || {};
  if (!isUuid(userId) || userId === me.id) bad("Invalid user.");
  if (!REASONS.includes(reason)) bad("Choose a reason.");
  if (!(await query("select 1 from users where id=$1", [userId])).rowCount) bad("User not found.", 404);
  await query(
    `insert into reports(reporter,reported,reason) values($1,$2,$3)
     on conflict (reporter,reported) do update set reason=excluded.reason, created_at=now()`, [me.id, userId, reason]);
  const n = (await query("select count(*)::int as n from reports where reported=$1", [userId])).rows[0].n;
  if (reason === "underage" || n >= HIDE_AT) await query("update users set hidden=true where id=$1", [userId]);
  if (block) await blockUser(me.id, userId);
  return { ok: true };
}));
module.exports = r;
