# Chatgram Frontend

Mobile-first, Instagram Direct-inspired web chat application built with React 18, Vite, TypeScript, and Tailwind CSS.

## Non-negotiable Target: Cloudflare Pages

This frontend is designed for seamless, zero-config deployment to **Cloudflare Pages**.

### Deployment Steps (Cloudflare Pages)

1. **Push to Git**:
   Push the repository to GitHub or GitLab.

2. **Cloudflare Dashboard**:
   - Navigate to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
   - Select your Chatgram repository.

3. **Build Configuration**:
   - **Framework preset**: `Vite`
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`

4. **Environment Variables**:
   Add the following variables in **Settings** -> **Environment variables**:
   - `VITE_API_URL`: `https://<your-hf-username>-<your-hf-space>.hf.space/api/v1`
   - `VITE_WS_URL`: `wss://<your-hf-username>-<your-hf-space>.hf.space/ws`

5. **Deploy & SPA Routing**:
   - Click **Save and Deploy**.
   - The file `public/_redirects` (`/* /index.html 200`) is automatically applied to enable standard SPA client-side routing on page refreshes.
   - Once deployed, copy your `https://<project-name>.pages.dev` URL and add it to the backend `CORS_ORIGINS` setting on Hugging Face Spaces!

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Setup env
cp .env.example .env
# Edit .env to point to your local or remote backend:
# VITE_API_URL=http://localhost:7860/api/v1
# VITE_WS_URL=ws://localhost:7860/ws

# 3. Start development server
npm run dev
```

