# Ava Deployment Guide — Render.com

## Deploy to Render.com

1. Push your code to GitHub.
2. Go to [render.com](https://render.com) and create a new **Web Service**.
3. Connect your GitHub repo.
4. Use these settings:
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Port:** 3000

5. Add the environment variable:
   - `GEMINI_API_KEY` = your Gemini API key

6. Click **Deploy**. Your app will be live in ~3 minutes!
