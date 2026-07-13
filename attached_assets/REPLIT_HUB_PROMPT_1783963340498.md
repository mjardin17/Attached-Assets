# Empire OS Hub — Replit Build Prompt

Build a local web app called **Empire OS Hub**. This is the central command dashboard for a multi-channel AI content empire. It runs on the user's Windows machine and is accessed from any device (including phone) via ngrok.

---

## Stack
- React + Vite + Tailwind CSS
- No backend framework needed — pure frontend
- GitHub REST API (Personal Access Token) for repo access
- localStorage for all persistence
- PWA enabled (installable on phone home screen)

---

## CRITICAL — No AI API Keys
This app NEVER calls any AI APIs directly. All AI agents are used through their existing web subscriptions.

When user dispatches to an agent:
1. Generate the full handoff prompt
2. Auto-copy to clipboard
3. Open the agent's web URL in a new tab:
   - Claude → https://claude.ai
   - Gemini → https://gemini.google.com
   - Grok → https://grok.x.ai
   - ChatGPT → https://chat.openai.com
   - DeepSeek → https://chat.deepseek.com
4. Show a toast: "Prompt copied — paste it in the chat"

The ONLY external API used is GitHub REST API with a free Personal Access Token.

---

## Mobile-First Design
Design for phone FIRST, then desktop. On mobile:
- Bottom nav bar (not sidebar)
- Full-screen panels that slide in
- Big touch-friendly buttons (min 48px tap targets)
- Handoff prompt fills full screen with one-tap copy
- Mission board is a vertical scrollable card list

On desktop:
- Left sidebar for navigation
- Multi-column layouts
- Keyboard shortcuts

Dark theme throughout. Colors: slate-900 background, slate-800 cards, indigo-500 accents, emerald-400 success, rose-500 error.

---

## PWA Setup
- Add manifest.json: name "Empire OS Hub", short_name "EmpireOS", theme_color "#1e1b4b", background_color "#0f172a", display "standalone", icons at 192x192 and 512x512
- Add service worker for offline caching of the shell
- "Add to Home Screen" banner on first mobile visit

---

## Startup Files
Include `START_HUB.bat` for Windows:
```bat
@echo off
title Empire OS Hub
cd /d %~dp0
echo Starting Empire OS Hub...
start "" npm run dev
timeout /t 3
echo Starting ngrok tunnel...
ngrok http 5173
```
Prints the ngrok public URL so Josh can open it on his phone.

---

## Section 1 — Projects Panel

Left sidebar (desktop) / bottom nav item (mobile).

Each project has:
- Name, emoji icon, color tag
- GitHub repo URL
- List of context files (CLAUDE.md, AGENT_MEMORY.md, MISSION_BOARD.json, etc.)
- Per-agent memory notes
- Active/inactive toggle

Default projects pre-loaded:
1. 🎬 Gods & Glory Pipeline — github.com/mjardin17/viral-engine
2. 🛒 Boss Listers — reseller cross-listing app
3. 🏛️ Empire OS — main orchestration system
4. 📚 StoryForge — book generation engine
5. 👕 Merch — print-on-demand automation

Click project → loads it as active context for all panels.

---

## Section 2 — Agent Selector

Top tab bar. Five agents:

| Agent | Color | URL |
|-------|-------|-----|
| Claude | Indigo | claude.ai |
| Gemini | Blue | gemini.google.com |
| Grok | Orange | grok.x.ai |
| ChatGPT | Green | chat.openai.com |
| DeepSeek | Purple | chat.deepseek.com |

Each agent tab shows:
- Last session date
- What they worked on last
- Their memory file for the active project

Switching agents loads that agent's context.

---

## Section 3 — Context File Manager

- Drag-and-drop zone: drop any .md, .json, .txt file to load it
- GitHub file browser: enter repo URL + PAT → browse repo tree → click file to load
- Loaded files shown as dismissable chips: "CLAUDE.md ✕" "MISSION_BOARD.json ✕"
- File viewer: click a chip to read the file with syntax highlighting
- "Active Context" count shown in header

---

## Section 4 — Handoff Prompt Generator

The killer feature. Big prominent button: **"Generate Handoff Prompt"**

Pulls together:
1. Active project name + description
2. All loaded context files (full content)
3. Active agent's memory for this project
4. Current missions from MISSION_BOARD.json (pending + in_progress only)
5. GitHub: last 5 commit messages from the repo
6. Today's date + what was done last session

Output format:
```
EMPIRE OS AGENT — READ FIRST
Agent: [Claude/Gemini/Grok/etc]
Project: [Project Name]
Repo: [GitHub URL]
Date: [Today]

=== CONTEXT FILES ===
[Full content of each loaded file]

=== YOUR MISSIONS ===
[Pending and in-progress missions]

=== RECENT CHANGES ===
[Last 5 git commits]

=== LAST SESSION ===
[Agent's memory/notes from last session]

=== START HERE ===
[User types what they want done today]
```

One-tap copy button. Auto-opens agent tab. Toast notification: "Copied — go paste it."

---

## Section 5 — Mission Board

Kanban board. Four columns: Pending | In Progress | Complete | Blocked

Each card shows:
- Task title
- Assigned agent (color-coded chip)
- Project tag
- Priority (P1/P2/P3)
- Notes field

Actions:
- Drag between columns
- Assign to agent
- Click to expand and edit
- "Dispatch" button on card → generates handoff prompt for that specific task

Saves to MISSION_BOARD.json format (compatible with existing Empire OS MISSION_BOARD.json):
```json
{
  "missions": [
    {
      "id": "m001",
      "type": "render",
      "status": "pending",
      "assigned_to": "claude",
      "target": "GG_EP013",
      "priority": 1,
      "notes": ""
    }
  ]
}
```

Export button: downloads current board as MISSION_BOARD.json to drop into the repo.

---

## Section 6 — Episode Tracker

Table showing all episodes across all channels. Columns:
- Episode ID (GG_EP001 etc.)
- Title
- Script status (✅ / ❌)
- Render status (✅ / 🔄 / ❌)
- Upload status (✅ / ❌)
- YouTube URL (clickable)
- Views (pulled from YouTube API if key provided — optional)
- Duration

Filter by channel (GG / IL / LO / ED). Sort by any column.

Data loaded from: AGENT_MEMORY.md or manually entered.

---

## Section 7 — Agent Chat Log

Per agent, per project. Simple text area.

"What did this agent do last session?" — running log, newest first.

Not a full chat — just session notes. Example:
```
2026-07-12 | Claude | Gods & Glory
- Updated bm_george voice in auto_render.py
- Built fix_yt_titles.py
- Updated GAME_PLAN.md with 6 money tracks
```

Editable. Saved to localStorage. Shows in handoff prompt automatically.

---

## Section 8 — Smart Dispatch

"Who should I ask?" panel.

User types a task description. App recommends the best agent based on rules:
- Code architecture / pipeline work → Claude
- External app builds / React/Vite → Grok
- Content / scripts / research → Gemini
- Math / data analysis → DeepSeek
- General writing / docs → ChatGPT

Shows reasoning: "Recommended: Claude — this is pipeline architecture work"

One button: "Dispatch to [Agent]" → generates prompt → opens tab → copies to clipboard.

---

## Section 9 — Status Dashboard

Persistent bottom bar (desktop) or pull-up drawer (mobile).

Shows:
- 🎬 Rendering: [episode name] or "Nothing rendering"
- 📤 Upload queue: [count] episodes ready
- ✅ Last upload: EP012 | [YouTube URL]
- 💰 Higgsfield credits: [manually entered, tracked per session]
- 📅 Today's priority: [pulled from Mission Board P1 task]

---

## Section 10 — Settings

- GitHub PAT input (stored in localStorage, never sent anywhere except GitHub API)
- ngrok URL display (paste your ngrok URL here for sharing)
- Export all data as JSON backup
- Import JSON backup
- Clear all data (with confirmation)
- Theme toggle (dark only for now — light mode future)

---

## Section 11 — Live Pipeline Monitor

Real-time status panel. Auto-refreshes every 30 seconds via GitHub API.

Reads from the repo:
- `renders/` — lists all GG_EP*_final.mp4 files and their sizes
- `uploaded_videos.json` — which episodes are uploaded and their YouTube URLs
- `render_log.json` (if exists) — active render progress

Shows a card for every episode EP001–EP025:
- ⏳ Rendering — file exists in output/ but not renders/
- ✅ Rendered — final MP4 exists, size shown in MB
- 📤 Uploaded — has a YouTube URL, clickable link
- ❌ Missing — no script or render found

Top bar shows:
- Total rendered / Total uploaded / Total episodes
- "Last checked: 30s ago" with manual refresh button

Mobile: full-screen card list with color-coded status pills.
Desktop: table view with sortable columns.

No polling backend needed — GitHub API reads file metadata directly.

---

## Section 12 — Social Post Composer

One caption → formatted for every platform at once.

Input fields:
- Episode selector (dropdown of all uploaded episodes)
- Custom caption textarea (or auto-generate from episode title)
- Hashtag presets per channel (GG, IL, LO, ED)

Output — one tab per platform, auto-formatted:
- **YouTube** — full description with timestamps placeholder + hashtags
- **Facebook** — 2-3 sentences + YouTube link + hashtags
- **Instagram** — punchy 1-liner + YouTube link in bio reminder + 30 hashtags
- **TikTok** — hook line + 3-5 hashtags only (TikTok hates walls of text)
- **X (Twitter)** — 280 char version + link

One-tap copy button on each tab. "Copy All" copies all versions to clipboard as a formatted block.

Saves drafts to localStorage per episode so you don't lose work.

---

## File Structure
```
empire-os-hub/
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── icons/ (192.png, 512.png)
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── components/
│   │   ├── ProjectPanel.jsx
│   │   ├── AgentSelector.jsx
│   │   ├── ContextFileManager.jsx
│   │   ├── HandoffGenerator.jsx
│   │   ├── MissionBoard.jsx
│   │   ├── EpisodeTracker.jsx
│   │   ├── AgentLog.jsx
│   │   ├── SmartDispatch.jsx
│   │   └── StatusBar.jsx
│   ├── hooks/
│   │   ├── useGitHub.js
│   │   ├── useProjects.js
│   │   └── useAgents.js
│   └── utils/
│       ├── promptBuilder.js
│       └── missionBoard.js
├── START_HUB.bat
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## What This Replaces
- Manually copying context files between AI sessions
- Not knowing which agent did what
- Forgetting mission status
- Episodes scattered with no central status view
- No mobile access to the pipeline

This is the central nervous system for the entire Empire OS operation.
