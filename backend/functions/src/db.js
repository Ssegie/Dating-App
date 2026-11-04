const { Pool } = require("pg");

// Keep the pool tiny: every function instance has its own. Use your provider's pooled connection string.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined,
  max: 3,
});
const query = (text, params) => pool.query(text, params);

// Great-circle distance in km from `me` to users aliased as `u`. Values come from our own DB.
const distExpr = (me) =>
  `6371*acos(least(1,greatest(-1,cos(radians(${+me.lat}))*cos(radians(u.lat))*cos(radians(u.lng)-radians(${+me.lng}))+sin(radians(${+me.lat}))*sin(radians(u.lat)))))`;

// Public-facing columns (never expose uid, exact location or birthdate). Photo urls are relative to the API base.
const COLS =
  "u.id,u.name,date_part('year',age(u.birthdate))::int as age,u.bio,u.job,u.school,u.tags,u.hue,u.photos," +
  "(select coalesce(json_agg('/photos/'||up.id order by up.position,up.created_at),'[]'::json) from user_photos up where up.user_id=u.id and up.status='approved') as imgs";

const pair = (a, b) => (a < b ? [a, b] : [b, a]);
module.exports = { pool, query, distExpr, COLS, pair };
