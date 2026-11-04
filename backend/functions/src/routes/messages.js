const { Router } = require("express");
const { query } = require("../db");
const { route, bad } = require("../wrap");
const { isUuid } = require("../safety");
const r = Router();

const REPLIES = ["Ha, that made my day. Tell me more!","Okay, I like your energy. Plans this weekend?","Same here! We should compare notes over coffee.","Great question. Depends on the company 😉","You seem fun. Free Saturday?","Now I’m curious. What’s your go-to order?"];

const member = async (matchId, meId) => {
  if (!isUuid(matchId)) return null;
  return (await query(
    `select m.id, o.id as other_id, o.is_bot from matches m
     join users o on o.id = case when m.user_a=$2 then m.user_b else m.user_a end
     where m.id=$1 and (m.user_a=$2 or m.user_b=$2)`, [matchId, meId])).rows[0];
};

r.get("/messages", route(async (req, me) => {
  const matchId = req.query.matchId;
  if (!(await member(matchId, me.id))) bad("Not your match.", 403);
  const out = await query(
    `select id, (sender=$2) as mine, body, created_at from messages
     where match_id=$1 and created_at<=now() order by created_at, id`, [matchId, me.id]);
  return { messages: out.rows };
}));

r.post("/messages", route(async (req, me) => {
  const { matchId, body } = req.body || {};
  const text = String(body || "").trim().slice(0, 1000);
  if (!text) bad("Message is empty.");
  const m = await member(matchId, me.id);
  if (!m) bad("Not your match.", 403);
  await query("insert into messages(match_id,sender,body) values($1,$2,$3)", [matchId, me.id, text]);
  if (m.is_bot) {
    // Demo bots reply after a short delay (GET hides messages dated in the future).
    const n = (await query("select count(*)::int as n from messages where match_id=$1", [matchId])).rows[0].n;
    await query("insert into messages(match_id,sender,body,created_at) values($1,$2,$3, now() + interval '1500 milliseconds')",
      [matchId, m.other_id, REPLIES[n % REPLIES.length]]);
  }
  return { ok: true };
}));
module.exports = r;
