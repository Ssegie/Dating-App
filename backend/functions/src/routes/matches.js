const { Router } = require("express");
const { query, distExpr, COLS } = require("../db");
const { route } = require("../wrap");
const { isUuid } = require("../safety");
const r = Router();

r.get("/matches", route(async (req, me) => {
  const out = await query(
    `select m.id as match_id, ${COLS}, round(${distExpr(me)})::int as km,
       (select body from messages where match_id=m.id and created_at<=now() order by created_at desc, id desc limit 1) as last
     from matches m
     join users u on u.id = case when m.user_a=$1 then m.user_b else m.user_a end
     where (m.user_a=$1 or m.user_b=$1)
       and not exists (select 1 from blocks b where (b.blocker=$1 and b.blocked=u.id) or (b.blocker=u.id and b.blocked=$1))
     order by m.created_at desc`, [me.id]);
  return { matches: out.rows };
}));

// Unmatch
r.delete("/matches", route(async (req, me) => {
  if (isUuid(req.query.id)) await query("delete from matches where id=$1 and (user_a=$2 or user_b=$2)", [req.query.id, me.id]);
  return { ok: true };
}));
module.exports = r;
