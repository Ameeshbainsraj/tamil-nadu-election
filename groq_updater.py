"""
TN26 · Groq YouTube → Google Sheets Auto-Updater
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Install:
  pip install groq yt-dlp gspread oauth2client pydub

Usage:
  python groq_updater.py "https://www.youtube.com/watch?v=XXXX"

What it does:
  1. Downloads audio from YouTube video
  2. Sends to Groq Whisper → transcribes it
  3. Sends transcript to Groq LLaMA → extracts seat counts
  4. Writes results into your Google Sheet automatically
"""

import os, sys, json, re, tempfile
import yt_dlp
from groq import Groq
import gspread
from oauth2client.service_account import ServiceAccountCredentials

# ── CONFIG ────────────────────────────────────────
from dotenv import load_dotenv
load_dotenv()
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("ERROR: GROQ_API_KEY not found. Check your .env file.")
    sys.exit(1)
SHEET_ID       = "1170HdchakPRIZO4URqot2jfAhtkorl1tP9-Tpq80Ia0"
CREDS_JSON     = "service_account.json"         # Google Service Account credentials

PARTY_KEYS = ["tvk", "dmk", "admk", "ntk", "others"]
PARTY_NAMES = {
    "tvk":    ["tvk", "tamilaga vettri", "vijay", "tamilaga vetri kazhagam"],
    "dmk":    ["dmk", "dravida munnetra", "stalin", "dmk alliance", "india alliance"],
    "admk":   ["admk", "aiadmk", "all india anna", "edappadi", "eps"],
    "ntk":    ["ntk", "naam tamilar", "seeman"],
    "others": ["others", "independent", "other parties", "bjp", "pmk", "dmdk"]
}
# ─────────────────────────────────────────────────

client = Groq(api_key=GROQ_API_KEY)


def download_audio(yt_url: str) -> str:
    tmpdir = tempfile.mkdtemp()
    out_path = os.path.join(tmpdir, "audio.mp3")
    opts = {
        "format": "bestaudio/best",
        "outtmpl": os.path.join(tmpdir, "audio.%(ext)s"),
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "64",
        }],
        "quiet": True,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.download([yt_url])
    return out_path


def transcribe_audio(file_path: str) -> str:
    print("🎙  Transcribing with Groq Whisper...")
    with open(file_path, "rb") as f:
        result = client.audio.transcriptions.create(
            file=f,
            model="whisper-large-v3-turbo",
            language="ta",        # Tamil — change to "en" if English commentary
            response_format="text",
            temperature=0.0
        )
    return result if isinstance(result, str) else result.text


def extract_seats_from_transcript(transcript: str) -> dict:
    print("🤖  Extracting seat data with Groq LLaMA...")
    prompt = f"""
You are analyzing a Tamil Nadu 2026 election results news transcript.
Extract the CURRENT seat counts for each party/alliance.
Return ONLY a valid JSON object with exactly these keys:
tvk, dmk, admk, ntk, others

Each value should have: seats (total won+leading), won (declared winner), leading (currently leading).

If a party is not mentioned or has 0 seats, use 0.

Transcript:
\"\"\"
{transcript[:6000]}
\"\"\"

Respond ONLY with JSON like:
{{
  "tvk":    {{"seats": 110, "won": 85, "leading": 25}},
  "dmk":    {{"seats": 50,  "won": 40, "leading": 10}},
  "admk":   {{"seats": 56,  "won": 44, "leading": 12}},
  "ntk":    {{"seats": 0,   "won": 0,  "leading": 0}},
  "others": {{"seats": 18,  "won": 14, "leading": 4}}
}}
"""
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=400,
    )
    raw = response.choices[0].message.content.strip()
    # Extract JSON from response
    match = re.search(r'\{.*\}', raw, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON found in response:\n{raw}")
    return json.loads(match.group())


def update_google_sheet(data: dict):
    print("📊  Updating Google Sheet...")
    scope = [
        "https://spreadsheets.google.com/feeds",
        "https://www.googleapis.com/auth/drive"
    ]
    creds  = ServiceAccountCredentials.from_json_keyfile_name(CREDS_JSON, scope)
    gc     = gspread.authorize(creds)
    sheet  = gc.open_by_key(SHEET_ID).sheet1

    PARTY_SHORTS = {"tvk":"TVK","dmk":"DMK+","admk":"ADMK","ntk":"NTK","others":"OTH"}

    # Write header if empty
    if sheet.cell(1,1).value != "party":
        sheet.update("A1:E1", [["party","short","seats","won","leading"]])

    # Update rows 2-6
    rows = []
    for i, key in enumerate(PARTY_KEYS):
        d = data.get(key, {"seats":0,"won":0,"leading":0})
        rows.append([key, PARTY_SHORTS[key], d.get("seats",0), d.get("won",0), d.get("leading",0)])

    sheet.update("A2:E6", rows)
    print("✅  Sheet updated successfully!")
    for key in PARTY_KEYS:
        d = data.get(key, {})
        print(f"   {PARTY_SHORTS[key]:6s} → seats: {d.get('seats',0):4d}  won: {d.get('won',0):4d}  leading: {d.get('leading',0):4d}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python groq_updater.py \"https://www.youtube.com/watch?v=XXXX\"")
        sys.exit(1)

    yt_url = sys.argv[1]
    print(f"📺  Processing: {yt_url}")

    audio_path = download_audio(yt_url)
    transcript = transcribe_audio(audio_path)
    print(f"\n📝  Transcript preview:\n{transcript[:400]}...\n")

    data = extract_seats_from_transcript(transcript)
    print(f"\n📦  Extracted data:\n{json.dumps(data, indent=2)}\n")

    update_google_sheet(data)

    # Cleanup
    import shutil
    shutil.rmtree(os.path.dirname(audio_path), ignore_errors=True)


if __name__ == "__main__":
    main()