const { Router } = require("express");
const { query, distExpr, COLS } = require("../db");
const { route } = require("../wrap");
const r = Router();

r.get("/deck", route(async (req, me) => {
  const d = distExpr(me);
  const out = await query(
    `select * from (
       select ${COLS}, round(${d})::int as km, ${d} as dist, u.is_bot
       from users u
       where u.id<>$1 and not u.hidden
         and not exists (select 1 from swipes s where s.swiper=$1 and s.target=u.id)
         and not exists (select 1 from blocks b where (b.blocker=$1 and b.blocked=u.id) or (b.blocker=u.id and b.blocked=$1))
         and date_part('year',age(u.birthdate)) between $2 and $3
         and ($4::text='everyone' or u.gender=$4::text)
         and (u.show='everyone' or u.show=$5::text)
     ) x where dist<=$6
     order by is_bot, dist limit 20`,
    [me.id, me.age_min, me.age_max, me.show, me.gender, me.dist_max]);
  return { deck: out.rows.map(({ dist, is_bot, ...p }) => p) };
}));
module.exports = r;
