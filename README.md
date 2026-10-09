# Student Management App

This repository contains a Vite/React frontend in `client/` and an Express/MongoDB API in `server/`.

## Run locally

1. Create a MongoDB Atlas database and add your current public IP address to **Network Access**.
2. Copy `server/.env.example` to `server/.env` and set `MONGO_URI` to the connection string from Atlas. Replace the placeholders; URL-encode any special characters in the database password.
3. Copy `client/.env.example` to `client/.env.local`. Keep its local API URL for development.
4. In separate terminals, run `npm install` and `npm start` from `server/`, then run `npm install` and `npm run dev` from `client/`.

## Deploy to Vercel

Deploy the frontend and API as **two Vercel projects** connected to this same GitHub repository:

### API project

- Set **Root Directory** to `server`.
- Add `MONGO_URI` in **Settings → Environment Variables** for Production (and Preview if needed). Paste the Atlas connection string there; do not commit it.
- Deploy. Check that `https://<api-project>.vercel.app/api/health` responds. A healthy response reports `"database": "connected"`.

### Frontend project

- Set **Root Directory** to `client`.
- Use `npm run build` as the build command and `dist` as the output directory.
- Add `VITE_API_URL` as an environment variable for Production (and Preview if needed), with the API project's origin, for example `https://<api-project>.vercel.app` (no trailing slash).
- Redeploy after setting the variable. Vite embeds `VITE_*` values at build time.

The API project includes Vercel rewrites so the frontend's `/students` requests reach the serverless API. If the frontend displays a connection error, first confirm `VITE_API_URL` is set to the API deployment—not `localhost`—and inspect the API project's function logs.

## Push to GitHub

Create an empty GitHub repository, then open a terminal in this repository's top-level folder (the folder containing `client/` and `server/`) and run:

```powershell
git init
git add .gitignore README.md client server
git status --short
```

Before continuing, confirm `server/.env` is **not** listed in the staged changes. Then push the initial commit:

```powershell
git commit -m "Initial project"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repository>.git
git push -u origin main
```

Replace the GitHub URL with the one shown for your repository. Keep `server/.env` and any real credentials out of GitHub. If a real credential was ever pushed, rotate it in its provider before deploying.

## MongoDB Atlas connectivity

The API needs a valid Atlas `MONGO_URI`, an active database cluster, and network access from the machine or hosting environment. Atlas **Network Access** must permit the API's outbound IP. Vercel may not use a fixed outbound IP on every plan; for a quick connectivity test, Atlas can temporarily allow `0.0.0.0/0`, but this exposes the database endpoint to all IPs and should only be used with a strong database password and least-privilege database user. Prefer fixed outbound IP access or a supported private networking option for production.

Do not put `MONGO_URI` in the frontend or in a `VITE_*` variable. Frontend variables are public in the built JavaScript.
