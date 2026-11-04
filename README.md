# Amoura: Love, with intention.

```
amoura-app/
├── frontend/   Next.js app (the UI only)            -> deploy to Vercel
└── backend/    Express API as a Firebase Function   -> deploy to Firebase
    ├── functions/   API code, runs locally or as the Firebase function "api"
    ├── db/          Postgres schema and demo profiles
    └── firebase.json
```

The two halves only talk over HTTP (`NEXT_PUBLIC_API_URL`), so each can be deployed, changed and scaled on its own.
Any other client (a mobile or desktop app, for example) can use the same API.

## Run everything locally

You need Node 20+ and Postgres (Docker is the easiest). Open two terminals.

**Terminal 1: backend**
```bash
cd backend
docker compose up -d                 # Postgres (skip if you have your own; edit DATABASE_URL)
cd functions
npm install
npm run db:init                      # creates tables + 12 demo profiles
npm run dev                          # API on http://localhost:4000/api
```

**Terminal 2: frontend**
```bash
cd frontend
npm install
npm run dev                          # http://localhost:3000
```

Both folders already contain a ready-made `.env.local` for local use (dev login, no Firebase account needed).
Open an incognito window to get a second test user.

## Deploy

### 1. Backend to Firebase
1. Create a Firebase project and upgrade it to the **Blaze** (pay-as-you-go) plan. Functions need it to reach an outside database.
2. Create a hosted Postgres database (Neon, Supabase, or Cloud SQL). Use its **pooled** connection string. Create the tables once:
   `DATABASE_URL="..." PGSSL=true npm run db:init -- --no-seed` (from `backend/functions`; `--no-seed` skips the demo profiles).
3. In Firebase: enable Authentication (Google first), and note your web app config.
4. From `backend/`:
   ```bash
   npm install -g firebase-tools
   firebase login
   cp .firebaserc.example .firebaserc        # put your project id inside
   firebase functions:secrets:set DATABASE_URL
   ```
   Create `backend/functions/.env` with:
   ```
   FRONTEND_ORIGINS=https://your-app.vercel.app
   PGSSL=true
   MODERATION=vision
   ```
   (Add `GOOGLE_VISION_KEY` as another secret if you use photo moderation. Never put DEV_AUTH here; the API refuses to run with it in the cloud.)
5. `firebase deploy --only functions`. Copy the URL of the `api` function.
6. The function region is set in `functions/index.js` (`europe-west1`). Pick a region close to your database.

### 2. Frontend to Vercel
1. Push the repo to GitHub and import it in Vercel. Set **Root Directory** to `frontend`.
2. Environment variables: `NEXT_PUBLIC_API_URL` (the function URL), `NEXT_PUBLIC_DEV_AUTH=false`, and the four `NEXT_PUBLIC_FIREBASE_*` values.
3. In Firebase Authentication > Settings > Authorized domains, add your Vercel domain.

## Things to know
- **Postgres is not part of Firebase.** Firebase provides the functions and sign-in; the data lives in the Postgres you host separately.
- Chat refreshes by polling every 2.5 seconds. Each poll is a function call, so this costs more as users grow. Real-time chat (Firestore) is the planned fix.
- Photos are stored in Postgres for now. Move them to Firebase Storage when you have many users (only `functions/src/routes/photos.js` changes).
- Review reports with SQL (`select * from reports order by created_at desc;`). There is no admin screen yet.

## Mobile and desktop apps (installable web app)
The React frontend is a Progressive Web App (PWA). The same code installs as an app on phones and desktops, and updates whenever you deploy to Vercel.

- **What is included:** web app manifest (`frontend/app/manifest.js`), app icons (`frontend/public/icons/`, plus `app/icon.png` and `app/apple-icon.png`), a small service worker (`frontend/public/sw.js`) and an offline page (`frontend/public/offline.html`). The service worker never caches API calls or photos, so no personal data is stored offline.
- **How people install it:**
  - Chrome or Edge on desktop and Android: an **Install Amoura** button appears in the Profile tab (and in the browser's address bar).
  - iPhone or iPad: Safari > Share > **Add to Home Screen** (the Profile tab shows this hint).
- **Testing it:** the install prompt only works on `https://` (Vercel provides this) or on `localhost` with a production build: `npm run build && npm start` in `frontend/`. It does not appear under `npm run dev`.
- **Changing the icons:** replace the PNGs in `frontend/public/icons/` (192 and 512 px, plus a 512 px "maskable" version with extra padding) and `frontend/app/icon.png`, `frontend/app/apple-icon.png` (180 px).

### Later: store and installer versions (optional)
Only needed if you want to be listed in app stores or ship a downloadable desktop installer. Both reuse this same frontend.
- **App Store / Google Play:** wrap the site with Capacitor. Needs Xcode (Mac) and Android Studio. Apple can reject apps that are only a website, so add native features such as push notifications.
- **Windows / macOS / Linux installers:** wrap with Tauri or Electron.
- **Flutter** is not needed. Choose it only if you later want a fully native rewrite; this backend would work unchanged.
