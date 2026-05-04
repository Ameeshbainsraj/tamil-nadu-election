# TN26 · Tamil Nadu Election 2026 · Live Results Dashboard

> A real-time election results dashboard powered by AI Vision, auto-updating every 2 minutes.



## 🔴 Live Site
👉 [https://your-project.vercel.app](https://tamil-nadu-election.vercel.app/)

---

## 🧠 How It Works
1. **AI Vision** — Captures a frame from a live YouTube broadcast every 2 minutes  
2. **Groq LLaMA 4** — Extracts seat counts directly from the video frame  
3. **Auto Push** — Updates `data.json` and pushes changes to GitHub  
4. **Vercel** — Detects the push and redeploys the site (~30 seconds)

---

## ⚡ Tech Stack

| Layer           | Technology                               |
|-----------------|------------------------------------------|
| AI Vision       | Groq LLaMA 4 Scout (multimodal)          |
| Transcription   | Groq Whisper Large v3                    |
| Frontend        | Vanilla JS, HTML5 Canvas, CSS animations |
| Deployment      | Vercel (auto-deploy on push)             |
| Data Pipeline   | Python, yt-dlp, ffmpeg                   |
| Version Control | GitHub auto-commit pipeline              |

---

## 📸 Features
- 🔴 Live ticker with real-time seat counts  
- 🎯 Majority tracker (118 seats)  
- 🍩 Animated donut chart (seat share)  
- 🎉 Victory overlay with confetti on majority  
- ⚡ Auto-refresh every 12 seconds  
- 🤖 AI reads numbers directly from broadcast frames  

---

## 🚀 Run Locally

```bash
pip install groq yt-dlp python-dotenv
# Add your GROQ_API_KEY to .env
python screen_updater.py "https://www.youtube.com/watch?v=XXXX"



📁 Project Structure
├── index.html          # Dashboard UI
├── app.js              # Frontend live data fetching
├── style.css           # Dark theme UI
├── screen_updater.py   # AI Vision pipeline
├── data.json           # Live results (auto-updated)
└── auto_update.bat     # Windows auto-updater loop






