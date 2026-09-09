# SmartEdu OS — Live Vercel & Cloud AI Deployment Guide

This guide walks you through deploying **SmartEdu OS** live to the web using **Vercel** with **Free Unlimited Cloud AI**, structured identically to your SIH project.

---

## Architecture Overview

- **Frontend**: Vite + React 18 + Tailwind CSS + 60 FPS HTML5 Canvas Physics & Circuit Engines.
- **Backend**: Express.js API deployed as **Vercel Serverless Functions** (`/api/*` via `api/index.js`).
- **Cloud AI**: Integrated **Pollinations.ai** cloud engine — **100% free, zero API key required, unlimited tokens** for Socratic chat tutoring, in-lecture doubt solving, and numerical simulation synthesis.
- **Offline / Local AI**: Seamless fallback to local Ollama (`http://localhost:11434`) whenever available.

---

## Method 1: Deploy via Vercel Web Dashboard (Recommended — Same as SIH)

### Step 1: Create a GitHub Repository
1. Initialize git in `smartedu-os` (or extract `smartedu-os.zip`):
   ```bash
   cd smartedu-os
   git init
   git add .
   git commit -m "feat: SmartEdu OS ready for Vercel deployment"
   ```
2. Create a new repository on [github.com](https://github.com/new) named `smartedu-os`.
3. Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/smartedu-os.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Import into Vercel
1. Go to [vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and click **Import** next to `smartedu-os`.
3. Vercel will automatically detect the settings from `vercel.json`:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**.
5. Within 60 seconds, your site will be live at:
   `https://smartedu-os-xxxx.vercel.app`

---

## Method 2: Instant Deploy via Vercel CLI (From Terminal)

1. Open your terminal in the `smartedu-os` directory:
   ```bash
   cd "c:\Users\Sayan Saha\Downloads\smartedu-os"
   ```
2. Run:
   ```bash
   npx vercel
   ```
3. Follow the quick interactive prompts:
   - **Set up and deploy?**: `Y`
   - **Which scope?**: (Select your account)
   - **Link to existing project?**: `N`
   - **Project name**: `smartedu-os`
   - **In which directory is code located?**: `./`
4. Deploy to production:
   ```bash
   npx vercel --prod
   ```
5. Your live production URL will be displayed in the terminal!

---

## Method 3: Dual Deployment (Frontend on Vercel + Backend on Render)

If you prefer keeping the continuous Node.js backend server running on Render (like `SatQuery-AI` in SIH):

1. **Deploy Backend to Render**:
   - Go to [render.com](https://dashboard.render.com/blueprints).
   - Click **New Blueprint Instance**.
   - Select your repository; Render will read `render.yaml` and deploy `smartedu-backend` automatically on port 3001.
2. **Connect Frontend on Vercel**:
   - In your Vercel project settings, add an Environment Variable:
     - **Name**: `VITE_API_URL`
     - **Value**: `https://smartedu-backend.onrender.com`
   - Redeploy the frontend.

---

## Verification Checklist After Deployment

Once deployed live on Vercel:
1. Open your `https://smartedu-os-xxxx.vercel.app` URL.
2. Observe the status bar in the header:
   - **Status Badge**: Green indicator showing `Cloud AI Engine // Online`.
3. Test **Lecture Tab**:
   - Play video lectures with split-screen synchronized 60 FPS simulations.
   - Switch between 6-language auto-translating captions.
   - Ask an in-lecture doubt to the AI assistant.
4. Test **CyberSim Tab**:
   - Select circuit or physics simulations (555 Timer, Op-Amp, Full Adder, Gravity, Black Hole).
   - Adjust sliders to see real-time 60 FPS numerical physics rendering.
   - Enter a natural language query (e.g. `simulate double pendulum with air friction`) to compile dynamic simulations.
