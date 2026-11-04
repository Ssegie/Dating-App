const { query, pair } = require("./db");
const isUuid = (s) => typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
// Blocking removes any match (and its chat, via cascade) in both directions.
async function blockUser(meId, otherId) {
  await query("insert into blocks(blocker,blocked) values($1,$2) on conflict do nothing", [meId, otherId]);
  const [a, b] = pair(meId, otherId);
  await query("delete from matches where user_a=$1 and user_b=$2", [a, b]);
}
module.exports = { isUuid, blockUser };
