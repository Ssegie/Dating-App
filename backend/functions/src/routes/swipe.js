const { Router } = require("express");
const { query, distExpr, COLS, pair } = require("../db");
const { route, bad } = require("../wrap");
const { isUuid } = require("../safety");
const r = Router();

r.post("/swipe", route(async (req, me) => {
  const { targetId, kind } = req.body || {};
  if (!["like", "nope", "super"].includes(kind)) bad("Invalid swipe.");
  if (!isUuid(targetId)) bad("Profile not found.", 404);
  const t = (await query("select id,is_bot,likes_you from users where id=$1", [targetId])).rows[0];
  if (!t || t.id === me.id) bad("Profile not found.", 404);

  if (kind === "super") {
    // Atomic: only decrement if one is left, so double-taps can't overspend.
    const s = await query("update users set super_left=super_left-1 where id=$1 and super_left>0 returning super_left", [me.id]);
    if (!s.rowCount) bad("no_super_likes", 429);
  }
  await query(
    `insert into swipes(swiper,target,kind) values($1,$2,$3)
     on conflict (swiper,target) do update set kind=excluded.kind, created_at=now()`, [me.id, t.id, kind]);

  let match = false;
  if (kind !== "nope") {
    const back = await query("select 1 from swipes where swiper=$1 and target=$2 and kind in ('like','super')", [t.id, me.id]);
    // Demo bots: some like you back; a Super Like always matches.
    match = back.rowCount > 0 || (t.is_bot && (t.likes_you || kind === "super"));
    if (match) {
      const [a, b] = pair(me.id, t.id);
      await query("insert into matches(user_a,user_b) values($1,$2) on conflict do nothing", [a, b]);
    }
  }
  return { match };
}));

// Rewind the caller's most recent swipe.
r.delete("/swipe", route(async (req, me) => {
  const s = (await query(
    `delete from swipes where swiper=$1 and target=(select target from swipes where swiper=$1 order by created_at desc limit 1)
     returning target, kind`, [me.id])).rows[0];
  if (!s) return { user: null };
  if (s.kind === "super") await query("update users set super_left=super_left+1 where id=$1", [me.id]);
  const [a, b] = pair(me.id, s.target);
  await query("delete from matches where user_a=$1 and user_b=$2", [a, b]);
  const u = (await query(`select ${COLS}, round(${distExpr(me)})::int as km from users u where u.id=$1`, [s.target])).rows[0];
  return { user: u };
}));
module.exports = r;
