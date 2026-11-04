const { Router } = require("express");
const express = require("express");
const { query } = require("../db");
const { route, bad } = require("../wrap");
const { moderate } = require("../moderation");
const { isUuid } = require("../safety");
const r = Router();

const MAX_PHOTOS = 6, MAX_BYTES = 800 * 1024;
const isJpeg = (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
const pics = async (id) =>
  (await query(`select id, '/photos/'||id as url, status from user_photos where user_id=$1 order by position, created_at`, [id])).rows;
const normalize = (userId, firstId = null) =>
  query(
    `with o as (select id, row_number() over (order by (id=$2::uuid) desc, position, created_at) - 1 as p from user_photos where user_id=$1)
     update user_photos set position=o.p from o where user_photos.id=o.id`, [userId, firstId]);

// Public by unguessable id so <img> tags work without auth headers. Only approved photos are served.
r.get("/photos/:id", async (req, res) => {
  if (!isUuid(req.params.id)) return res.status(404).end();
  try {
    const out = await query("select data from user_photos where id=$1 and status='approved'", [req.params.id]);
    if (!out.rowCount) return res.status(404).end();
    res.set({ "content-type": "image/jpeg", "cache-control": "public, max-age=3600", "x-content-type-options": "nosniff", "cross-origin-resource-policy": "cross-origin" });
    res.send(out.rows[0].data);
  } catch (e) { console.error(e); res.status(500).end(); }
});

r.get("/photos", route(async (req, me) => ({ pics: await pics(me.id) })));

// Body is the raw JPEG (the browser already resized it and removed EXIF/GPS data).
r.post("/photos", express.raw({ type: "image/jpeg", limit: "1mb" }), route(async (req, me) => {
  const buf = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
  if (!buf.length) bad("No image received.");
  if (buf.length > MAX_BYTES) bad("That photo is too large. Try a smaller one.", 413);
  if (!isJpeg(buf)) bad("Only JPEG photos are supported.", 415);
  const n = (await query("select count(*)::int as n from user_photos where user_id=$1", [me.id])).rows[0].n;
  if (n >= MAX_PHOTOS) bad(`You can add up to ${MAX_PHOTOS} photos.`);
  const status = await moderate(buf);
  if (status === "rejected") bad("This photo can’t be used on Amoura. Please choose another.", 422);
  await query("insert into user_photos(user_id,position,data,status) values($1,$2,$3,$4)", [me.id, n, buf, status]);
  return { pics: await pics(me.id), status };
}));

r.patch("/photos", route(async (req, me) => {
  const { id } = req.body || {};
  if (!isUuid(id)) bad("Invalid photo.");
  await normalize(me.id, id);
  return { pics: await pics(me.id) };
}));

r.delete("/photos", route(async (req, me) => {
  const id = req.query.id;
  if (!isUuid(id)) bad("Invalid photo.");
  await query("delete from user_photos where id=$1 and user_id=$2", [id, me.id]);
  await normalize(me.id);
  return { pics: await pics(me.id) };
}));
module.exports = r;
