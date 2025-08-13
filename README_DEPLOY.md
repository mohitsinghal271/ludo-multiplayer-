
# Ludo Multiplayer — Deploy Online (Line by Line)

## A) Put this project on GitHub
1) Go to GitHub → New → Repository name: `ludo-multiplayer` → Public → Create.
2) On your PC, unzip `ludo-deploy-ready.zip`.
3) Upload the **entire** unzipped folder to the repo (both `server` and `client` must be at the repo root).
4) Commit the files.

## B) Deploy SERVER on Render
1) Sign in at https://render.com → New + → Web Service.
2) Connect your GitHub → choose the `ludo-multiplayer` repo.
3) Root Directory: `server`
4) Build Command: `npm install`
5) Start Command: `node index.js`
6) Click **Create Web Service** and wait until status is **Live**.
7) Copy the URL, e.g. `https://ludo-server-xxxx.onrender.com`.

## C) Deploy WEBSITE on Vercel
1) Sign in at https://vercel.com → Add New → Project → Import the same repo.
2) Set **Root Directory** to `client`.
3) Add Environment Variable:
   - Name: `VITE_SOCKET_URL`
   - Value: your Render URL (from step B7), e.g. `https://ludo-server-xxxx.onrender.com`
4) Build Command: `npm run build` (auto)
5) Output Directory: `dist` (auto)
6) Deploy → copy the public link (e.g. `https://ludo-yourname.vercel.app`).

## D) Play
1) Open your Vercel link.
2) Click **Create Room** → share the code with your friend.
3) Friend opens the same link → **Join** with the code.
4) Click **Start Game** → take turns with **Roll Dice**.

## Troubleshooting
- If joining fails, verify `VITE_SOCKET_URL` and that the Render server is **Live**.
- Use HTTPS URLs to avoid “mixed content” issues.
- Free Render may sleep; first load can take a few seconds.
