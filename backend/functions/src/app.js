const express = require("express");
const cors = require("cors");

const app = express();
app.disable("x-powered-by");
const origins = (process.env.FRONTEND_ORIGINS || "http://localhost:3000").split(",").map((s) => s.trim());
app.use(cors({
  origin: (o, cb) => cb(null, !o || origins.includes(o)),
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["authorization", "content-type", "x-dev-user"],
  maxAge: 600,
}));
app.use(express.json({ limit: "50kb" }));

// Mounted at "/" and "/api" so both the raw function URL and a /api/* rewrite work.
const router = express.Router();
for (const f of ["me", "deck", "swipe", "likes", "matches", "messages", "photos", "blocks", "reports"]) router.use(require(`./routes/${f}`));
router.get("/health", (req, res) => res.json({ ok: true }));
app.use("/api", router);
app.use("/", router);
app.use((req, res) => res.status(404).json({ error: "not found" }));
module.exports = app;
