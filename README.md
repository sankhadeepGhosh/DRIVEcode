# 🚀 DRIVEcode — Personal AI Assistant & Interactive Website Builder

<p align="center">
  <a href="https://github.com/sankhadeepGhosh/DRIVEcode/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License: MIT" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19.0-61dafb?style=flat-square&logo=react" alt="React 19" /></a>
  <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite" alt="Vite 6" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/TailwindCSS-4.0-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS v4" /></a>
  <a href="https://ai.google.dev/"><img src="https://img.shields.io/badge/Google-Gemini%20API-4285F4?style=flat-square&logo=google" alt="Google Gemini" /></a>
  <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-Auth%20%26%20Database-3ECF8E?style=flat-square&logo=supabase" alt="Supabase" /></a>
  <a href="https://github.com/sankhadeepGhosh"><img src="https://img.shields.io/badge/Author-sankhadeepGhosh-rose?style=flat-square&logo=github" alt="Author" /></a>
</p>

---

## 📖 Overview

**DRIVEcode** is a personal AI assistant, research companion, and interactive web application workspace. Inspired by the refined typography, clean negative space, and responsive interfaces of modern AI tools like Claude and ChatGPT, DRIVEcode combines fluid conversational intelligence with an **in-browser Website Builder and live sandbox**, an autonomous **Deep Web Research engine**, and **Supabase Cloud Sync** with Google OAuth.

---

## ✨ Features

- 💬 **Conversational AI Streaming**: Real-time Server-Sent Events (SSE) streaming powered by the official `@google/genai` SDK with full markdown formatting, syntax highlighting, and conversational context retention.
- 🌐 **In-Browser Website Builder & Sandbox**:
  - Ask DRIVEcode to build web apps, landing pages, interactive calculators, or portfolios in natural language.
  - Automatically compiles standalone HTML/CSS/JavaScript bundles.
  - Live split-screen sandbox preview with viewport toggles (Desktop, Tablet, Mobile) and 1-click HTML bundle export.
- 🔍 **Autonomous Deep Web Research**:
  - Multi-step research mode with real-time progress indicators, search query traces, and cited sources.
  - Generates comprehensive synthesis reports with key takeaways.
- 🔐 **Supabase Cloud Sync & Google OAuth**:
  - Multi-device chat history and user preferences synchronization.
  - Google Sign-In with Row Level Security (RLS) policies.
  - **Frictionless Local Guest Mode**: Start chatting immediately with local browser storage even without logging in.
- 📎 **Multimodal File Reasoning**:
  - Upload images (PNG, JPEG, WebP), PDFs, spreadsheets, and source code files.
  - In-browser file parsing and base64 inline visual transmission directly to Gemini vision.
- 🎙️ **Voice Interaction**: Built-in speech-to-text dictation and natural speech synthesis audio playback.
- 🎨 **Deep Aesthetic Customization**:
  - System, Light, and Dark modes with eye-safe contrast.
  - Custom desktop and mobile wallpaper uploads with blur and opacity controls.
  - Typography engine (Plus Jakarta Sans, Newsreader Serif, JetBrains Mono) with font size scaling.
  - Custom accent colors and persona prompts.
- 🛡️ **Full-Stack Security Proxy**:
  - API keys remain strictly server-side inside Express `/api` routes and are never leaked to the client browser.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript 5.8, Vite 6 |
| **Styling & Animation** | Tailwind CSS v4, Motion (`motion/react`), Lucide React icons |
| **Backend & Proxy** | Express 4, Node.js, `tsx`, `esbuild` |
| **AI Integration** | Official Google Gen AI SDK (`@google/genai`), OpenRouter API fallback |
| **Authentication & DB** | Supabase (`@supabase/supabase-js`), PostgreSQL, Row Level Security (RLS) |
| **Typography** | Plus Jakarta Sans, Newsreader, JetBrains Mono |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm** (v9+) or **pnpm** / **yarn**
- **Git**

### 2. Clone the Repository
```bash
git clone https://github.com/sankhadeepGhosh/DRIVEcode.git
cd DRIVEcode
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Open `.env` and provide your API keys:
```env
# Required: Free API key from Google AI Studio (https://aistudio.google.com/)
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"

# Optional: Host URL (default: http://localhost:3000)
APP_URL="http://localhost:3000"

# Optional: Supabase credentials for cloud sync & Google OAuth
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"

# Optional: OpenRouter key for alternative open-source models
OPENROUTER_API_KEY=""
```

### 5. Run Development Server
```bash
npm run dev
```
Open your browser at 👉 **[http://localhost:3000](http://localhost:3000)**.

---

## 🗄️ Supabase Cloud Sync Setup (Optional)

To enable cross-device conversation sync and Google Sign-In:

1. Create a free project at [supabase.com](https://supabase.com/).
2. In your Supabase Dashboard, open the **SQL Editor** &rarr; **New Query**.
3. Copy the contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. This provisions:
   - `profiles`: User account metadata
   - `user_settings`: Synchronized themes, fonts, and wallpapers
   - `conversations`: Chat sessions with tags and pinned status
   - `messages`: Full conversation histories with attachments and research traces
   - Row Level Security (RLS) policies guaranteeing strict data privacy.
4. Set up **Google OAuth**:
   - In Supabase, go to **Authentication** &rarr; **Providers** &rarr; **Google**.
   - Enable Google Sign-In and copy the **Callback URL**.
   - Create a Web OAuth Client ID in [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and add the callback URL.
   - Paste the Google Client ID & Secret back into Supabase.
   - Under **URL Configuration**, add your app domain to **Redirect URLs**.
5. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your `.env` file.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts local Express server and Vite development server on port `3000`. |
| `npm run build` | Compiles client assets (`vite build`) and bundles `server.ts` into `dist/server.cjs` via `esbuild`. |
| `npm run start` | Boots the compiled standalone production server (`node dist/server.cjs`). |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`). |
| `npm run clean` | Removes compiled `dist/` directory. |

---

## 📂 Project Architecture

```text
DRIVEcode/
├── index.html                 # Entry HTML template with fonts and metadata
├── package.json               # Dependencies and build scripts
├── server.ts                  # Express backend proxy (SSE streaming, Gemini SDK)
├── .env.example               # Template environment configuration
├── .gitignore                 # Excluded directories and secret files
├── LICENSE                    # MIT License
├── supabase/
│   └── schema.sql             # Complete PostgreSQL DDL & RLS policies
└── src/
    ├── main.tsx               # Client React DOM entry point
    ├── App.tsx                # Primary state engine, workspace layout, router
    ├── index.css              # Tailwind CSS styles and theme variables
    ├── types.ts               # Shared TypeScript interfaces
    ├── context/
    │   └── AuthContext.tsx    # Supabase authentication provider & session listener
    ├── components/
    │   ├── Aura.tsx           # Ambient status and audio visualizer
    │   ├── ChatInput.tsx      # Text input, file uploads, mode selector
    │   ├── ChatMessage.tsx    # Message bubble, markdown parser, code syntax highlighter
    │   ├── LivePreview.tsx    # Interactive sandbox preview & responsive frame
    │   ├── LoginPage.tsx      # Google OAuth login & guest mode gateway
    │   ├── ModelSelector.tsx  # Multi-model switcher dropdown
    │   ├── ResearchPanel.tsx  # Deep web research progress & citation cards
    │   ├── SettingsModal.tsx  # Appearance, wallpaper, typography, and account settings
    │   ├── Sidebar.tsx        # Conversation archive, search, and session manager
    │   └── WelcomeScreen.tsx  # Hero landing with quick action prompts
    └── lib/
        ├── ai-router.ts       # AI model dispatch engine
        ├── storage.ts         # LocalStorage manager with cloud synchronization
        ├── attachments/       # Document, image, and PDF parser
        ├── preview/           # Live sandbox HTML generator & code extractor
        ├── research/          # Autonomous web exploration engine
        └── supabase/          # Supabase client factory & CRUD operations
```

---

## 📤 Pushing to GitHub

To push this codebase to your GitHub repository:

```bash
# 1. Initialize git (if not already initialized)
git init

# 2. Stage all files (safe: .env is automatically excluded by .gitignore)
git add .

# 3. Create initial commit
git commit -m "feat: complete release of DRIVEcode AI assistant and website builder"

# 4. Set main branch
git branch -M main

# 5. Link remote repository
git remote add origin https://github.com/sankhadeepGhosh/DRIVEcode.git

# 6. Push to GitHub
git push -u origin main
```

*(You can also use the **Export to GitHub** feature directly from Google AI Studio settings menu).*

---

## 👤 Author

- **sankhadeepGhosh** — [@sankhadeepGhosh](https://github.com/sankhadeepGhosh)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
