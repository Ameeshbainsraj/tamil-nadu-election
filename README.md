# TN26 · Tamil Nadu Election 2026 · Live Results Dashboard

> A real-time election results dashboard powered by AI Vision, auto-updating every 2 minutes.

![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)
![Tech](https://img.shields.io/badge/Stack-Python%20%7C%20JS%20%7C%20Groq%20AI-blue)

## 🔴 Live Site
👉 https://your-project.vercel.app

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




This was fromt the actual live youtube 
<img width="1385" height="778" alt="image" src="https://github.com/user-attachments/assets/1ceed07b-16bd-48b2-8cde-e7ccb41437e2" />

This was updating Live
<img width="1911" height="933" alt="image" src="https://github.com/user-attachments/assets/ac305490-a4d9-4f1e-a465-f8e8731b9e07" />



