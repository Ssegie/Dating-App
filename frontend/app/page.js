"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const DEV = process.env.NEXT_PUBLIC_DEV_AUTH === "true";
const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/$/, "");
const asset = (u) => API + u; // photo urls from the backend are relative to the API base
const INTERESTS = ["Hiking","Coffee","Music","Cooking","Travel","Gaming","Film","Books","Fitness","Art","Dogs","Photography","Plants","Karaoke","Dancing","Tech"];
const HEART = "M50 82C16 56 8 38 8 26C8 14 17 7 28 7C37 7 46 12 50 21C54 12 63 7 72 7C83 7 92 14 92 26C92 38 84 56 50 82Z";
const ICON = {
  discover: '<path d="M12 21C5 16 3 12 3 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9 2.5C21 12 19 16 12 21z"/>',
  likes: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  matches: '<path d="M4 5h16v11H9l-5 4z"/>',
  me: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.5 3.6-7 8-7s8 2.5 8 7z"/>',
};
const TABS = [["discover", "Discover"], ["likes", "Likes"], ["matches", "Chats"], ["me", "Profile"]];
const bg = (h, i = 0) => { h = (h + i * 28) % 360; return `linear-gradient(165deg,hsl(${h} 70% 64%),hsl(${(h + 45) % 360} 55% 30%))`; };

async function api(path, opts = {}) {
  const headers = { "content-type": opts.type || "application/json" };
  if (DEV) {
    let id = localStorage.getItem("amoura_dev");
    if (!id) { id = "dev-" + Math.random().toString(36).slice(2, 8); localStorage.setItem("amoura_dev", id); }
    headers["x-dev-user"] = id;
  } else {
    const { idToken } = await import("../lib/firebase");
    const t = await idToken();
    if (t) headers.authorization = "Bearer " + t;
  }
  const r = await fetch(API + path, { method: opts.method, headers, body: opts.raw || (opts.body ? JSON.stringify(opts.body) : undefined), cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || r.statusText), { status: r.status });
  return j;
}

const Logo = ({ w = 34 }) => (
  <svg viewBox="-8 -8 116 108" width={w} aria-hidden="true">
    <g fill="none" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round">
      <path transform="translate(-6,-2)" stroke="var(--logo1)" d={HEART} />
      <path transform="translate(6,5)" stroke="var(--rose)" opacity=".92" d={HEART} />
    </g>
  </svg>
);
const Av = ({ p, size = 52, style }) => {
  const img = p.imgs && p.imgs[0];
  return <div className="av" style={{ background: img ? `center/cover url(${asset(img)}), ${bg(p.hue)}` : bg(p.hue), width: size, height: size, fontSize: size / 2, ...style }}>{img ? null : p.photos[0][0]}</div>;
};

/* ---------- Onboarding / edit profile ---------- */
function Onboard({ prev, onDone }) {
  const [f, setF] = useState(prev
    ? { name: prev.name, birthdate: prev.birthdate, bio: prev.bio, gender: prev.gender, show: prev.show, tags: prev.tags, dist_max: prev.dist_max, age_min: prev.age_min, age_max: prev.age_max }
    : { name: "", birthdate: "", bio: "", gender: "w", show: "everyone", tags: [] });
  const [err, setErr] = useState("");
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const toggle = (t) => setF((x) => ({ ...x, tags: x.tags.includes(t) ? x.tags.filter((y) => y !== t) : x.tags.length < 5 ? [...x.tags, t] : x.tags }));
  const adult = (d) => { const b = new Date(d), n = new Date(); let a = n.getFullYear() - b.getFullYear(); if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--; return a >= 18; };
  const submit = async () => {
    if (!f.name.trim()) return setErr("Add your first name.");
    if (!f.birthdate || !adult(f.birthdate)) return setErr("You need to be 18 or older to use Amoura.");
    if (f.tags.length < 2) return setErr("Pick at least 2 interests.");
    try { const r = await api("/me", { method: "PUT", body: { ...f, name: f.name.trim() } }); onDone(r.user); }
    catch (e) { setErr(e.message); }
  };
  return (
    <>
      {!prev && <div className="hero"><div className="wm">AMOURA</div><div className="tg">Love, with intention.</div></div>}
      <h1>{prev ? "Edit profile" : "Create your profile"}</h1>
      <p className="sub">A few details so we can introduce you well.</p>
      <label htmlFor="n">First name</label>
      <input id="n" maxLength={20} autoComplete="off" value={f.name} onChange={(e) => set("name", e.target.value)} />
      <label htmlFor="d">Date of birth</label>
      <input id="d" type="date" value={f.birthdate} onChange={(e) => set("birthdate", e.target.value)} />
      <label htmlFor="g">I am</label>
      <select id="g" value={f.gender} onChange={(e) => set("gender", e.target.value)}><option value="w">Woman</option><option value="m">Man</option><option value="o">Other</option></select>
      <label htmlFor="b">About you</label>
      <textarea id="b" rows={3} maxLength={140} placeholder="One or two lines is plenty" value={f.bio} onChange={(e) => set("bio", e.target.value)} />
      <label htmlFor="w">Show me</label>
      <select id="w" value={f.show} onChange={(e) => set("show", e.target.value)}><option value="everyone">Everyone</option><option value="w">Women</option><option value="m">Men</option></select>
      <label>Interests (pick 2 to 5)</label>
      <div className="pick">{INTERESTS.map((t) => <button key={t} type="button" aria-pressed={f.tags.includes(t)} onClick={() => toggle(t)}>{t}</button>)}</div>
      <p className="err">{err}</p>
      <button className="btn rose" onClick={submit}>{prev ? "Save" : "Start meeting people"}</button>
    </>
  );
}

/* ---------- Safety: report, block, unmatch ---------- */
const REASONS = [["fake", "Fake profile or scam"], ["photos", "Inappropriate photos"], ["harass", "Harassment or abusive messages"], ["spam", "Spam or selling something"], ["underage", "Seems under 18"], ["other", "Something else"]];
function Safety({ p, matchId, onClose, onDone, toast }) {
  const [step, setStep] = useState("menu");
  const [reason, setReason] = useState("");
  const [also, setAlso] = useState(true);
  const [busy, setBusy] = useState(false);
  const run = async (fn, msg, kind) => { setBusy(true); try { await fn(); toast(msg); onDone(kind); } catch (e) { toast(e.message); } setBusy(false); };
  const block = () => run(() => api("/blocks", { method: "POST", body: { userId: p.id } }), `${p.name} is blocked`, "block");
  const unmatch = () => run(() => api(`/matches?id=${matchId}`, { method: "DELETE" }), "Unmatched", "unmatch");
  const report = () => reason ? run(() => api("/reports", { method: "POST", body: { userId: p.id, reason, block: also } }), also ? "Reported and blocked" : "Report sent. Thank you.", also ? "block" : "report") : toast("Choose a reason first");
  return (
    <div className="modal sheetm" role="dialog" aria-label={`Safety options for ${p.name}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel">
        {step === "menu" && <>
          <h3>{p.name}</h3>
          <button className="btn alt" onClick={() => setStep("report")}>Report {p.name}</button>
          <button className="btn alt" onClick={() => setStep("block")}>Block {p.name}</button>
          {matchId && <button className="btn alt" disabled={busy} onClick={unmatch}>Unmatch</button>}
          <button className="btn alt" onClick={onClose}>Cancel</button>
        </>}
        {step === "block" && <>
          <h3>Block {p.name}?</h3>
          <p className="sub">You won’t see each other anymore, and any match and chat will be deleted. You can unblock from your Profile.</p>
          <button className="btn" disabled={busy} onClick={block}>Block {p.name}</button>
          <button className="btn alt" onClick={() => setStep("menu")}>Back</button>
        </>}
        {step === "report" && <>
          <h3>Report {p.name}</h3>
          <p className="sub">What’s the problem? Reports are private.</p>
          {REASONS.map(([k, l]) => <label key={k} className="opt"><input type="radio" name="rs" checked={reason === k} onChange={() => setReason(k)} />{l}</label>)}
          <label className="opt"><input type="checkbox" checked={also} onChange={(e) => setAlso(e.target.checked)} />Also block {p.name}</label>
          <button className="btn" disabled={busy} onClick={report}>Send report</button>
          <button className="btn alt" onClick={() => setStep("menu")}>Back</button>
        </>}
      </div>
    </div>
  );
}

/* ---------- Photos (profile tab) ---------- */
// Resize in the browser and re-encode as JPEG. This also removes EXIF data such as GPS location.
async function toJpeg(file, q) {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const k = Math.min(1, 1080 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error("Could not read that image."))), "image/jpeg", q));
}
function Photos({ me, setMe, toast }) {
  const pics = me.pics || [];
  const [busy, setBusy] = useState(false);
  const inp = useRef(null);
  const upd = (p) => setMe({ ...me, pics: p });
  const add = async (e) => {
    const f = e.target.files[0]; e.target.value = ""; if (!f) return;
    setBusy(true);
    try {
      let q = 0.85, b = await toJpeg(f, q);
      while (b.size > 780 * 1024 && q > 0.4) { q -= 0.15; b = await toJpeg(f, q); }
      const r = await api("/photos", { method: "POST", raw: b, type: "image/jpeg" });
      upd(r.pics); toast(r.status === "pending" ? "Photo added. It will show once reviewed." : "Photo added");
    } catch (err) { toast(err.name === "InvalidStateError" || /read/.test(err.message) ? "Couldn’t read that image. Try a JPEG or PNG." : err.message); }
    setBusy(false);
  };
  const del = async (id) => { try { upd((await api(`/photos?id=${id}`, { method: "DELETE" })).pics); } catch (e) { toast(e.message); } };
  const main = async (id) => { try { upd((await api("/photos", { method: "PATCH", body: { id } })).pics); toast("Main photo changed"); } catch (e) { toast(e.message); } };
  return (
    <div className="sec"><h4>PHOTOS</h4>
      <div className="pgrid">
        {pics.map((p, i) => (
          <div key={p.id} className="pslot">
            <img src={asset(p.url)} alt={`Your photo ${i + 1}`} />
            {i === 0 && <span className="pb">Main</span>}
            {p.status !== "approved" && <span className="pb rv">{p.status === "pending" ? "In review" : "Rejected"}</span>}
            <div className="pact">
              {i > 0 && <button aria-label="Make main photo" onClick={() => main(p.id)}>★</button>}
              <button aria-label="Delete photo" onClick={() => del(p.id)}>✕</button>
            </div>
          </div>
        ))}
        {pics.length < 6 && <button className="pslot add" aria-label="Add photo" disabled={busy} onClick={() => inp.current.click()}>{busy ? "…" : "+"}</button>}
      </div>
      <input ref={inp} type="file" accept="image/*" hidden onChange={add} />
      <p className="sub" style={{ fontSize: 13, marginTop: 8 }}>Up to 6 photos. The first one is shown first. Location data is removed from every photo.</p>
    </div>
  );
}
function Blocked({ toast }) {
  const [l, setL] = useState([]);
  const load = useCallback(async () => { try { setL((await api("/blocks")).blocked); } catch {} }, []);
  useEffect(() => { load(); }, [load]);
  if (!l.length) return null;
  return (
    <div className="sec"><h4>BLOCKED PEOPLE</h4>
      {l.map((p) => (
        <div key={p.id} className="row" style={{ margin: "6px 0" }}><Av p={p} size={40} /><b>{p.name}</b>
          <button className="btn alt" style={{ marginLeft: "auto", padding: "6px 14px", fontSize: 14 }} onClick={async () => { try { await api(`/blocks?userId=${p.id}`, { method: "DELETE" }); toast(`${p.name} unblocked`); load(); } catch (e) { toast(e.message); } }}>Unblock</button></div>
      ))}
    </div>
  );
}

/* ---------- Install as an app (PWA) ---------- */
function InstallApp() {
  const [ev, setEv] = useState(null);
  const [ios, setIos] = useState(false);
  const [done, setDone] = useState(true);
  useEffect(() => {
    setDone(window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const before = (e) => { e.preventDefault(); setEv(e); };
    const installed = () => { setDone(true); setEv(null); };
    window.addEventListener("beforeinstallprompt", before);
    window.addEventListener("appinstalled", installed);
    return () => { window.removeEventListener("beforeinstallprompt", before); window.removeEventListener("appinstalled", installed); };
  }, []);
  if (done) return null;
  if (ev) return (
    <div className="sec"><h4>GET THE APP</h4>
      <p className="sub">Install Amoura on this device for a full-screen app experience.</p>
      <button className="btn rose" style={{ marginTop: 12 }} onClick={async () => { ev.prompt(); await ev.userChoice; setEv(null); }}>Install Amoura</button>
    </div>
  );
  if (ios) return <div className="sec"><h4>GET THE APP</h4><p className="sub">In Safari, tap the Share button, then “Add to Home Screen”.</p></div>;
  return null;
}

/* ---------- Swipe card ---------- */
function Card({ p, mine, onDecide, cardRef, under, onSafety }) {
  const [pi, setPi] = useState(0);
  const [open, setOpen] = useState(false);
  const d = useRef({ x0: null, y0: 0, dx: 0, dy: 0, moved: false });
  const imgs = p.imgs || [], photos = imgs.length ? imgs : p.photos, ph = imgs.length ? null : photos[Math.min(pi, photos.length - 1)];
  const sh = p.tags.filter((t) => mine.includes(t));
  const st = (c, s, v) => { const e = c.querySelector(s); if (e) e.style.opacity = Math.min(Math.max(v, 0), 1); };
  const handlers = under ? {} : {
    onPointerDown: (e) => { if (e.target.closest(".ib,.sheet")) return; Object.assign(d.current, { x0: e.clientX, y0: e.clientY, moved: false }); e.currentTarget.classList.add("drag"); e.currentTarget.setPointerCapture(e.pointerId); },
    onPointerMove: (e) => { const s = d.current; if (s.x0 === null) return; s.dx = e.clientX - s.x0; s.dy = e.clientY - s.y0; if (Math.abs(s.dx) + Math.abs(s.dy) > 8) s.moved = true; const c = e.currentTarget; c.style.transform = `translate(${s.dx}px,${Math.min(s.dy, 0)}px) rotate(${s.dx / 18}deg)`; st(c, ".l", s.dx / 100); st(c, ".n", -s.dx / 100); st(c, ".s", Math.abs(s.dx) < 60 ? -s.dy / 100 : 0); },
    onPointerUp: (e) => {
      const s = d.current, c = e.currentTarget; if (s.x0 === null) return; s.x0 = null; c.classList.remove("drag");
      if (!s.moved) { const r = c.getBoundingClientRect(); setPi((i) => (e.clientX - r.left < r.width * 0.4 ? Math.max(0, i - 1) : Math.min(photos.length - 1, i + 1))); }
      else if (s.dx > 110) return onDecide("like"); else if (s.dx < -110) return onDecide("nope"); else if (s.dy < -110 && Math.abs(s.dx) < 80) return onDecide("super");
      c.style.transform = ""; c.querySelectorAll(".stamp").forEach((x) => (x.style.opacity = 0)); s.dx = s.dy = 0;
    },
  };
  return (
    <div ref={cardRef} className={`card ${under ? "under" : "top"} ${open ? "open" : ""}`} style={{ background: bg(p.hue) }} {...handlers}>
      <div className="ph" style={{ background: bg(p.hue, pi) }}>
        {imgs.length ? <img className="pic" src={asset(imgs[Math.min(pi, imgs.length - 1)])} alt={`${p.name}, photo ${pi + 1}`} draggable={false} /> : <><div className="big">{ph[0]}</div><div className="cap">{ph[1]}</div></>}
      </div>
      <div className="bars">{photos.map((_, i) => <i key={i} className={i <= pi ? "on" : ""} />)}</div>
      <div className="stamp l">LIKE</div><div className="stamp n">NOPE</div><div className="stamp s">SUPER LIKE</div>
      <div className="info">
        <h2>{p.name} <span>{p.age}</span></h2>
        <div className="meta">{[p.job, `${p.km} km away`].filter(Boolean).join(" · ")}</div>
        <div className="chips">{p.tags.slice(0, 3).map((t) => <span key={t} className={`chip ${sh.includes(t) ? "sh" : ""}`}>{t}</span>)}</div>
        <button className="ib" aria-label="Show profile" onClick={() => setOpen(true)}>i</button>
      </div>
      <div className="sheet">
        <button className="ib" aria-label="Close profile" onClick={() => setOpen(false)}>✕</button>
        <h3>{p.name}, {p.age}</h3>
        <p>{[p.job, p.school].filter(Boolean).join(" · ") || "Just joined Amoura"}</p>
        {p.bio && <><h3>About</h3><p>{p.bio}</p></>}
        <h3>Interests</h3>
        <div className="chips">{p.tags.map((t) => <span key={t} className={`chip ${sh.includes(t) ? "sh" : ""}`}>{t}</span>)}</div>
        <p style={{ marginTop: 12, fontSize: 13 }}>{sh.length ? `You share ${sh.length} interest${sh.length > 1 ? "s" : ""}, highlighted in gold.` : "No shared interests yet, which can be a good start."}</p>
        <button className="btn alt" style={{ marginTop: 14, width: "100%" }} onClick={onSafety}>Report or block {p.name}</button>
      </div>
    </div>
  );
}

/* ---------- Discover ---------- */
function Discover({ me, refreshMe, onMatch, toast, goSettings }) {
  const [deck, setDeck] = useState(null);
  const [hist, setHist] = useState(0);
  const [safe, setSafe] = useState(null);
  const top = useRef(null), busy = useRef(false);
  const load = useCallback(async () => { try { setDeck((await api("/deck")).deck); } catch (e) { toast(e.message); } }, [toast]);
  useEffect(() => { load(); }, [load, me.dist_max, me.age_min, me.age_max, me.show]);

  const decide = async (kind) => {
    const p = deck && deck[0]; if (!p || busy.current) return;
    const el = top.current, reset = () => { if (el) { el.style.transform = ""; el.querySelectorAll(".stamp").forEach((x) => (x.style.opacity = 0)); } };
    if (kind === "super" && me.super_left < 1) { reset(); return toast("No Super Likes left today"); }
    busy.current = true;
    if (el) { el.classList.remove("drag"); el.style.transform = kind === "super" ? "translateY(-700px)" : `translateX(${kind === "like" ? 600 : -600}px) rotate(${kind === "like" ? 30 : -30}deg)`; }
    const call = api("/swipe", { method: "POST", body: { targetId: p.id, kind } });
    await new Promise((r) => setTimeout(r, 230));
    try {
      const r = await call;
      setDeck((d) => d.slice(1)); setHist((h) => h + 1);
      if (kind === "super") refreshMe();
      if (r.match) onMatch(p, kind === "super");
    } catch (e) { reset(); toast(e.status === 429 ? "No Super Likes left today" : e.message); }
    busy.current = false;
  };
  const rewind = async () => {
    try { const r = await api("/swipe", { method: "DELETE" }); if (r.user) { setDeck((d) => [r.user, ...(d || [])]); refreshMe(); toast("Rewound"); } else toast("Nothing to rewind"); }
    catch (e) { toast(e.message); }
  };
  if (!deck) return <div className="empty"><Logo w={60} /></div>;
  const actions = (
    <div className="acts">
      <button className="act sm rw" aria-label="Rewind" onClick={rewind}>↺</button>
      <button className="act no" aria-label="Pass" onClick={() => decide("nope")}>✕</button>
      <button className="act sm si" aria-label={`Super Like (${me.super_left} left)`} onClick={() => decide("super")}>★</button>
      <button className="act lg yes" aria-label="Like" onClick={() => decide("like")}>♥</button>
      <button className="act sm bo" aria-label="Boost" onClick={() => toast("Boost is a demo button for now")}>⚡</button>
    </div>
  );
  if (!deck.length) return (
    <>
      <div className="empty"><Logo w={70} /><h2>You’ve seen everyone nearby</h2><p>Widen your distance or age range, or rewind to take a second look.</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}><button className="btn" onClick={goSettings}>Discovery settings</button><button className="btn alt" onClick={load}>Refresh</button></div></div>
      <div className="acts"><button className="act sm rw" aria-label="Rewind" onClick={rewind}>↺</button></div>
    </>
  );
  return (
    <>
      <div className="deck">
        {deck[1] && <Card key={deck[1].id} p={deck[1]} mine={me.tags} under />}
        <Card key={deck[0].id} p={deck[0]} mine={me.tags} onDecide={decide} cardRef={top} onSafety={() => setSafe(deck[0])} />
      </div>
      {actions}
      {safe && <Safety p={safe} onClose={() => setSafe(null)} toast={toast} onDone={() => { setDeck((d) => d.filter((x) => x.id !== safe.id)); setSafe(null); }} />}
    </>
  );
}

/* ---------- Likes ---------- */
function Likes({ toast, onMatch }) {
  const [likes, setLikes] = useState(null);
  const [gold, setGold] = useState(false);
  const load = useCallback(async () => { try { setLikes((await api("/likes")).likes); } catch (e) { toast(e.message); } }, [toast]);
  useEffect(() => { load(); setGold(localStorage.getItem("amoura_gold") === "1"); }, [load]);
  const act = async (p, kind) => { try { const r = await api("/swipe", { method: "POST", body: { targetId: p.id, kind } }); setLikes((l) => l.filter((x) => x.id !== p.id)); if (r.match) onMatch(p, false); } catch (e) { toast(e.message); } };
  if (!likes) return <div className="empty"><Logo w={60} /></div>;
  if (!likes.length) return <div className="empty"><Logo w={60} /><h2>No new likes</h2><p>Keep swiping. People who like you will show up here.</p></div>;
  return (
    <>
      <h1>Likes</h1><p className="sub">{likes.length} {likes.length > 1 ? "people like" : "person likes"} you</p>
      {!gold && <div className="gold"><b>Amoura Gold</b><p style={{ margin: "4px 0 12px" }}>See everyone who likes you and match instantly. (Demo: free to try.)</p><button className="btn" onClick={() => { localStorage.setItem("amoura_gold", "1"); setGold(true); }}>Unlock Gold</button></div>}
      <div className="grid" style={{ marginTop: 12 }}>
        {likes.map((p) => (
          <div key={p.id} className={`lk ${gold ? "" : "blur"}`} style={{ background: bg(p.hue) }}>
            <div className="ph" style={{ background: bg(p.hue) }} />{p.imgs && p.imgs.length ? <img className="pic" src={asset(p.imgs[0])} alt="" /> : <div className="big">{p.photos[0][0]}</div>}
            <div className="nm">{p.name}, {p.age}</div>
            {gold && <div className="bt"><button className="act sm no" aria-label={`Pass ${p.name}`} onClick={() => act(p, "nope")}>✕</button><button className="act sm yes" aria-label={`Like ${p.name}`} onClick={() => act(p, "like")}>♥</button></div>}
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- Matches + chat ---------- */
function Chat({ m, onBack, onMenu }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const box = useRef(null);
  const load = useCallback(async () => { try { setMsgs((await api(`/messages?matchId=${m.match_id}`)).messages); } catch {} }, [m.match_id]);
  useEffect(() => { load(); const t = setInterval(load, 2500); return () => clearInterval(t); }, [load]);
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [msgs]);
  const send = async (v) => { v = v.trim(); if (!v) return; setText(""); await api("/messages", { method: "POST", body: { matchId: m.match_id, body: v } }); load(); };
  return (
    <div className="chat">
      <div className="ch"><button className="ic" aria-label="Back" onClick={onBack}>←</button><Av p={m} size={42} /><b>{m.name}, {m.age}</b>
        <button className="ic" style={{ marginLeft: "auto" }} aria-label="Safety options" onClick={onMenu}>⋯</button></div>
      <div className="msgs" ref={box}>
        {!msgs.length && <div className="empty" style={{ padding: "20px 0" }}><p>You matched with {m.name}. Break the ice.</p></div>}
        {msgs.map((x) => <div key={x.id} className={`m ${x.mine ? "me" : "them"}`}>{x.body}</div>)}
      </div>
      {!msgs.length && <div className="qs">{[`Hey ${m.name}! 👋`, "What’s your perfect Sunday?", "Coffee or dinner first?"].map((q) => <button key={q} type="button" onClick={() => send(q)}>{q}</button>)}</div>}
      <form className="send" onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <input placeholder="Write a message" autoComplete="off" aria-label="Message" value={text} onChange={(e) => setText(e.target.value)} /><button className="btn rose" type="submit">Send</button>
      </form>
    </div>
  );
}
function Matches({ toast, openId, clearOpen }) {
  const [list, setList] = useState(null);
  const [chat, setChat] = useState(null);
  const [safe, setSafe] = useState(false);
  const load = useCallback(async () => { try { setList((await api("/matches")).matches); } catch (e) { toast(e.message); } }, [toast]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (openId && list) { const m = list.find((x) => x.id === openId); if (m) { setChat(m); clearOpen(); } } }, [openId, list, clearOpen]);
  if (!list) return <div className="empty"><Logo w={60} /></div>;
  if (chat) return (
    <>
      <Chat m={chat} onBack={() => { setChat(null); load(); }} onMenu={() => setSafe(true)} />
      {safe && <Safety p={chat} matchId={chat.match_id} toast={toast} onClose={() => setSafe(false)} onDone={(k) => { setSafe(false); if (k !== "report") { setChat(null); load(); } }} />}
    </>
  );
  if (!list.length) return <div className="empty"><Logo w={60} /><h2>No matches yet</h2><p>When you and someone like each other, they’ll show up here.</p></div>;
  const nw = list.filter((m) => !m.last), old = list.filter((m) => m.last);
  return (
    <>
      <h1>Matches</h1>
      {nw.length > 0 && <><h4>NEW MATCHES</h4><div className="new">{nw.map((m) => <button key={m.id} onClick={() => setChat(m)}><Av p={m} size={68} style={{ border: "3px solid var(--rose)", marginBottom: 4 }} />{m.name}</button>)}</div></>}
      {old.length > 0 && <><h4>MESSAGES</h4>{old.map((m) => <button key={m.id} className="row" onClick={() => setChat(m)}><Av p={m} /><div><b>{m.name}</b><small>{m.last}</small></div></button>)}</>}
    </>
  );
}

/* ---------- Profile + settings ---------- */
function Me({ me, setMe, toast, onEdit, onReset, onLogout }) {
  const [s, setS] = useState({ dist_max: me.dist_max, age_min: me.age_min, age_max: me.age_max, show: me.show });
  const save = async () => {
    try { const r = await api("/me", { method: "PUT", body: { ...me, ...s } }); setMe(r.user); toast("Settings saved"); } catch (e) { toast(e.message); }
  };
  return (
    <>
      <h1>{me.name}, {me.age}</h1>
      <p className="sub">{me.bio || "Add a bio so people know you."}</p>
      <div className="chips" style={{ margin: "12px 0" }}>{me.tags.map((t) => <span key={t} className="chip" style={{ background: "var(--chip)" }}>{t}</span>)}</div>
      <div className="two"><button className="btn alt" style={{ flex: 1 }} onClick={onEdit}>Edit profile</button><button className="btn alt" style={{ flex: 1 }} onClick={onReset}>Delete account</button></div>
      <Photos me={me} setMe={setMe} toast={toast} />
      <div className="sec"><h4>DISCOVERY SETTINGS</h4>
        <label htmlFor="ds">Maximum distance: <b>{s.dist_max} km</b></label>
        <input id="ds" type="range" min="1" max="50" value={s.dist_max} style={{ padding: 0 }} onChange={(e) => setS({ ...s, dist_max: +e.target.value })} />
        <label>Age range</label>
        <div className="two">
          <input type="number" min="18" max="99" aria-label="Minimum age" value={s.age_min} onChange={(e) => setS({ ...s, age_min: +e.target.value })} />
          <input type="number" min="18" max="99" aria-label="Maximum age" value={s.age_max} onChange={(e) => setS({ ...s, age_max: +e.target.value })} />
        </div>
        <label htmlFor="sw">Show me</label>
        <select id="sw" value={s.show} onChange={(e) => setS({ ...s, show: e.target.value })}><option value="everyone">Everyone</option><option value="w">Women</option><option value="m">Men</option></select>
        <button className="btn rose" style={{ marginTop: 16 }} onClick={save}>Save settings</button>
      </div>
      <Blocked toast={toast} />
      <InstallApp />
      <p className="sub" style={{ marginTop: 14, fontSize: 14 }}>{me.super_left} Super Likes left today</p>
      {DEV ? (
        <p className="devbar">Dev mode · <button onClick={() => { localStorage.removeItem("amoura_dev"); location.reload(); }}>Switch to a new test user</button></p>
      ) : <p className="devbar"><button onClick={onLogout}>Sign out</button></p>}
    </>
  );
}

/* ---------- App shell ---------- */
export default function App() {
  const [phase, setPhase] = useState("boot");
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState("discover");
  const [msg, setMsg] = useState("");
  const [modal, setModal] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [editing, setEditing] = useState(false);
  const tt = useRef();
  const toast = useCallback((t) => { setMsg(t); clearTimeout(tt.current); tt.current = setTimeout(() => setMsg(""), 1900); }, []);
  const loadMe = useCallback(async () => {
    try { const r = await api("/me"); setMe(r.user); setPhase(r.user ? "ready" : "onboard"); }
    catch (e) { if (e.status === 401) setPhase("login"); else { toast(e.message); setPhase("error"); } }
  }, [toast]);
  useEffect(() => {
    if (DEV) { loadMe(); return; }
    let off; import("../lib/firebase").then(({ authListen }) => { off = authListen((u) => (u ? loadMe() : setPhase("login"))); });
    return () => off && off();
  }, [loadMe]);
  useEffect(() => { if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") navigator.serviceWorker.register("/sw.js").catch(() => {}); }, []);
  const clearOpen = useCallback(() => setOpenId(null), []);
  const onMatch = useCallback((p, sup) => setModal({ p, sup }), []);

  const body = () => {
    if (phase === "boot") return <div className="empty"><Logo w={70} /></div>;
    if (phase === "error") return <div className="empty"><h2>Can’t reach the server</h2><p>Check that Postgres is running and you ran <code>npm run db:init</code>.</p><button className="btn" onClick={loadMe}>Try again</button></div>;
    if (phase === "login") return (
      <div className="empty"><div className="hero"><div className="wm">AMOURA</div><div className="tg">Love, with intention.</div></div>
        <button className="btn rose" style={{ marginTop: 24 }} onClick={async () => { const { loginGoogle } = await import("../lib/firebase"); try { await loginGoogle(); } catch (e) { toast(e.message); } }}>Continue with Google</button></div>
    );
    if (phase === "onboard" || editing) return <Onboard prev={editing ? me : null} onDone={(u) => { const first = !me; setMe(u); setEditing(false); setPhase("ready"); if (first) { setTab("me"); toast("Add a photo to stand out"); } }} />;
    if (tab === "discover") return <Discover me={me} refreshMe={loadMe} onMatch={onMatch} toast={toast} goSettings={() => setTab("me")} />;
    if (tab === "likes") return <Likes toast={toast} onMatch={onMatch} />;
    if (tab === "matches") return <Matches toast={toast} openId={openId} clearOpen={clearOpen} />;
    return <Me me={me} setMe={setMe} toast={toast} onEdit={() => setEditing(true)}
      onReset={async () => { if (confirm("Delete your account, swipes and matches?")) { await api("/me", { method: "DELETE" }); setMe(null); setPhase("onboard"); setTab("discover"); } }}
      onLogout={async () => { const { logout } = await import("../lib/firebase"); logout(); }} />;
  };
  const ready = phase === "ready";
  return (
    <div className="app">
      <div className="top">
        <div className="brand"><Logo w={34} /><span>AMOURA</span></div>
        {ready && <button className="ic" aria-label="Discovery settings" onClick={() => { setEditing(false); setTab("me"); }}>⚙</button>}
      </div>
      <main>{body()}</main>
      {ready && !editing && (
        <nav className="tabs" role="tablist">
          {TABS.map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
              <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: ICON[k] }} />{l}
            </button>
          ))}
        </nav>
      )}
      {modal && (
        <div className="modal" role="dialog" aria-label="New match"><div>
          <Logo w={54} /><h2>It’s a match!</h2>
          <p>{modal.sup ? `${modal.p.name} saw your Super Like.` : `You and ${modal.p.name} like each other.`}</p>
          <div className="pair"><div className="av" style={{ background: bg(330) }}>🙂</div><Av p={modal.p} size={104} style={{ border: "4px solid #fff", marginLeft: -20 }} /></div>
          <button className="btn rose" onClick={() => { setModal(null); setTab("matches"); setOpenId(modal.p.id); }}>Send a message</button>
          <button className="btn alt" style={{ color: "#fff", borderColor: "rgba(255,255,255,.4)" }} onClick={() => setModal(null)}>Keep swiping</button>
        </div></div>
      )}
      <div id="toast" className={msg ? "on" : ""} role="status">{msg}</div>
    </div>
  );
}
