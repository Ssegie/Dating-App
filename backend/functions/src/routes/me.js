const { Router } = require("express");
const { query } = require("../db");
const { route, bad } = require("../wrap");
const r = Router();

const TAGS = ["Hiking","Coffee","Music","Cooking","Travel","Gaming","Film","Books","Fitness","Art","Dogs","Photography","Plants","Karaoke","Dancing","Tech"];
const EMOJI = ["🙂","😊","😄","🌟","🌈","🎧","📸","🌻"];

const mine = async (id) =>
  (await query(
    `select id,name,to_char(birthdate,'YYYY-MM-DD') as birthdate,date_part('year',age(birthdate))::int as age,
            gender,bio,show,tags,hue,photos,dist_max,age_min,age_max,super_left,
            (select coalesce(json_agg(json_build_object('id',up.id,'url','/photos/'||up.id,'status',up.status) order by up.position,up.created_at),'[]'::json)
               from user_photos up where up.user_id=users.id) as pics
     from users where id=$1`, [id])).rows[0];

r.get("/me", route(async (req, me) => {
  if (!me) return { user: null };
  await query("update users set super_left=3, super_day=current_date where id=$1 and super_day<current_date", [me.id]);
  return { user: await mine(me.id) };
}, { needUser: false }));

r.put("/me", route(async (req, me, uid) => {
  const b = req.body || {};
  const name = String(b.name || "").trim();
  const bio = String(b.bio || "").trim();
  if (!name || name.length > 20) bad("Name must be 1 to 20 characters.");
  if (bio.length > 140) bad("Bio can be up to 140 characters.");
  const bd = new Date(b.birthdate);
  if (isNaN(bd)) bad("Enter a valid birthdate.");
  const now = new Date();
  let a = now.getFullYear() - bd.getFullYear();
  if (now.getMonth() < bd.getMonth() || (now.getMonth() === bd.getMonth() && now.getDate() < bd.getDate())) a--;
  if (a < 18) bad("You must be 18 or older to use Amoura.", 403);
  if (!["w", "m", "o"].includes(b.gender)) bad("Invalid gender.");
  if (!["everyone", "w", "m"].includes(b.show)) bad("Invalid show-me option.");
  const tags = [...new Set(b.tags || [])].filter((t) => TAGS.includes(t));
  if (tags.length < 2 || tags.length > 5) bad("Pick 2 to 5 interests.");
  const dist = Math.min(Math.max(+b.dist_max || 25, 1), 100);
  const amin = Math.min(Math.max(+b.age_min || 18, 18), 99);
  const amax = Math.min(Math.max(+b.age_max || 60, amin), 99);

  if (!me) {
    const e = EMOJI[Math.floor(Math.random() * EMOJI.length)];
    const ins = await query(
      `insert into users(uid,name,birthdate,gender,bio,show,tags,hue,photos,dist_max,age_min,age_max)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id`,
      [uid, name, b.birthdate, b.gender, bio, b.show, tags, Math.floor(Math.random() * 360), JSON.stringify([[e, "About me"]]), dist, amin, amax]);
    return { user: await mine(ins.rows[0].id) };
  }
  await query(
    `update users set name=$2,birthdate=$3,gender=$4,bio=$5,show=$6,tags=$7,dist_max=$8,age_min=$9,age_max=$10 where id=$1`,
    [me.id, name, b.birthdate, b.gender, bio, b.show, tags, dist, amin, amax]);
  return { user: await mine(me.id) };
}, { needUser: false }));

r.delete("/me", route(async (req, me) => {
  await query("delete from users where id=$1", [me.id]);
  return { ok: true };
}));
module.exports = r;
