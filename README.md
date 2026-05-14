# 🗄️ Personal Vault

A beautiful, canvas-based personal knowledge management workspace. Save prompts, links, images, design references, React components, docs, skills, and files — all organized in a visual, drag-and-drop interface.

![Stack](https://img.shields.io/badge/Frontend-HTML%20%2F%20CSS%20%2F%20JS-blue?style=flat-square)
![Convex](https://img.shields.io/badge/Backend-Convex-orange?style=flat-square)
![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=flat-square&logo=supabase)
![Google Drive](https://img.shields.io/badge/Storage-Google%20Drive-4285F4?style=flat-square&logo=google-drive)

---

## ✨ Features

- 🎨 **Canvas workspace** — drag, drop, and arrange floating document cards freely
- 📁 **Custom folders** — create named folders directly on the canvas
- 💾 **Persistent storage** — all items saved to Supabase via Convex backend
- ☁️ **Google Drive integration** — files, images, and ZIPs stored in organized Drive folders
- 🌙 **Dark / Light mode** — smooth theme toggle
- 🔍 **Search** — instant full-text search across all saved items
- 🗣️ **Voice feedback** — spoken confirmations via Web Speech API
- 📋 **Vault Directory** — masonry grid view of all saved content
- 🧠 **Item types** — Prompt, Link, Image, Design, React, Docs, PDF, Markdown, Skills, ZIP

---

## 🏗️ Architecture

```
index.html          ← Single-page app (canvas UI, modals, animations)
convex-api.js       ← Frontend connector to Convex cloud backend
convex/
  vault.ts          ← Convex action handlers (Node.js runtime)
                       ├── saveItem    → writes to Supabase
                       ├── getItems    → reads from Supabase
                       └── getDriveUploadUrl → creates file in Google Drive
```

### Data Flow
```
Browser (index.html)
  → convex-api.js (ConvexClient)
    → Convex Cloud (vault.ts actions)
      ├── Supabase PostgreSQL  (text, links, metadata)
      └── Google Drive         (images, PDFs, ZIPs)
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org) 18+
- A [Convex](https://convex.dev) account
- A [Supabase](https://supabase.com) project
- A Google Cloud service account with Drive API enabled

### 1. Install dependencies
```bash
npm install convex @supabase/supabase-js @googleapis/drive google-auth-library
```

### 2. Set up Supabase table
In your Supabase project's SQL Editor, run:
```sql
create table if not exists public.items (
  id            uuid primary key default gen_random_uuid(),
  type          text not null,
  folder        text not null,
  title         text,
  content       text,
  notes         text,
  drive_file_id text,
  created_at    timestamptz default now()
);

alter table public.items enable row level security;
create policy "service role full access"
  on public.items for all using (true) with check (true);
```

### 3. Set environment variables in Convex Dashboard
Go to **Settings → Environment Variables** in your [Convex Dashboard](https://dashboard.convex.dev) and add:

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Your Supabase `service_role` key |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email |
| `GOOGLE_PRIVATE_KEY` | Service account private key |
| `DRIVE_FOLDER_DOCS` | Google Drive folder ID for documents |
| `DRIVE_FOLDER_IMAGES` | Google Drive folder ID for images/designs |
| `DRIVE_FOLDER_ARCHIVES` | Google Drive folder ID for ZIPs |

### 4. Deploy Convex functions
```bash
npx convex dev
```
Keep this running while developing. For production deployment, run `npx convex deploy`.

### 5. Open the app
Open `index.html` directly in your browser, or deploy to any static host (Netlify, Vercel, GitHub Pages).

---

## 🌍 Deployment

Since this is a plain HTML/JS app, you can deploy it anywhere that serves static files:

**Netlify (recommended):**
1. Go to [netlify.com](https://netlify.com) → **Add new site → Deploy manually**
2. Drag your project folder onto the drop zone
3. Done ✅

> ⚠️ All secrets are stored in Convex Dashboard — **nothing sensitive is in the source code**.

---

## 🔒 Security Notes

- The `service_role` Supabase key is stored only in Convex environment variables (server-side)
- The Google service account JSON file is in `.gitignore` and never committed
- `.env.local` is also gitignored
- Convex actions run in a secure Node.js sandbox on Convex Cloud

---

## 📂 Project Structure

```
Personal - Vault/
├── index.html              ← Main app
├── convex-api.js           ← Convex frontend client
├── convex/
│   └── vault.ts            ← Backend actions
├── Assets/                 ← Static assets
├── .gitignore
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| UI | Vanilla HTML, CSS, JavaScript |
| Backend | [Convex](https://convex.dev) (Node.js actions) |
| Database | [Supabase](https://supabase.com) (PostgreSQL) |
| File Storage | Google Drive API |
| Auth | Google Service Account |
| Fonts | Google Fonts (Google Sans, Outfit) |
# InspoVault.-Canvas-Designer-_-.
# InspoVault.-Canvas-Designer-_-.
