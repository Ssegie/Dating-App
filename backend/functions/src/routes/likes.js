const { Router } = require("express");
const { query, distExpr, COLS } = require("../db");
const { route } = require("../wrap");
const r = Router();

r.get("/likes", route(async (req, me) => {
  const out = await query(
    `select ${COLS}, round(${distExpr(me)})::int as km from users u
     where u.id<>$1 and not u.hidden
       and not exists (select 1 from blocks b where (b.blocker=$1 and b.blocked=u.id) or (b.blocker=u.id and b.blocked=$1))
       and not exists (select 1 from swipes s where s.swiper=$1 and s.target=u.id)
       and (exists (select 1 from swipes s where s.swiper=u.id and s.target=$1 and s.kind in ('like','super'))
            or (u.is_bot and u.likes_you))
     order by u.created_at`, [me.id]);
  return { likes: out.rows };
}));
module.exports = r;
