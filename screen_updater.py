import subprocess, datetime, json, os, re, time, base64
import yt_dlp
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def grab_youtube_frame(yt_url: str) -> str:
    """Download a single frame from the YouTube stream as an image."""
    import tempfile
    tmpdir = tempfile.mkdtemp()
    frame_path = os.path.join(tmpdir, "frame.jpg")
    opts = {
        "format": "best[ext=mp4]/best",
        "outtmpl": os.path.join(tmpdir, "video.%(ext)s"),
        "quiet": True,
        "no_warnings": True,
    }
    # Get stream URL
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(yt_url, download=False)
        stream_url = info["url"]

    # Use ffmpeg to grab one frame
    subprocess.run([
        "ffmpeg", "-y", "-i", stream_url,
        "-frames:v", "1", "-q:v", "2", frame_path
    ], capture_output=True)
    return frame_path

def extract_seats_from_image(img_path: str) -> dict:
    """Send frame to Groq Vision → extract seat numbers."""
    print("👁️  Reading text from video frame...")
    with open(img_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()

    response = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{b64}"}
                },
                {
                    "type": "text",
                    "text": """This is a Tamil Nadu 2026 election results TV broadcast.
Read the seat count numbers visible on screen for each party.
TVK (த.வெ.க / Vijay's party), DMK+ alliance, ADMK+ alliance.
Return ONLY this JSON:
{
  "tvk": {"seats": N, "won": N, "leading": N},
  "dmk": {"seats": N, "won": N, "leading": N},
  "admk": {"seats": N, "won": N, "leading": N},
  "ntk": {"seats": N, "won": N, "leading": N},
  "others": {"seats": N, "won": N, "leading": N}
}"""
                }
            ]
        }],
        max_tokens=400
    )
    raw = response.choices[0].message.content.strip()
    match = re.search(r'\{.*\}', raw, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON in response: {raw}")

    cleaned = match.group()
    cleaned = re.sub(r',\s*}', '}', cleaned)
    cleaned = re.sub(r',\s*]', ']', cleaned)
    cleaned = re.sub(r'(\d)\s+(\d)', r'\1\2', cleaned)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        print(f"⚠️  JSON parse failed, extracting manually from:\n{raw}")
        result = {}
        for party in ["tvk", "dmk", "admk", "ntk", "others"]:
            m = re.search(rf'"{party}".*?"seats":\s*(\d+)', raw, re.DOTALL)
            result[party] = {"seats": int(m.group(1)) if m else 0, "won": 0, "leading": 0}
        return result

def write_and_push(data: dict):
    output = {
        "last_updated": datetime.datetime.now().isoformat(),
        "results": data
    }
    with open("data.json", "w") as f:
        json.dump(output, f, indent=2)
    print(f"💾  data.json saved: {data}")
    try:
        subprocess.run(["git", "add", "data.json"], check=True)
        subprocess.run(["git", "commit", "-m", "chore: update election data"], check=True)
        subprocess.run(["git", "push"], check=True)
        print("✅  Pushed to GitHub! Vercel redeploying...")
    except subprocess.CalledProcessError as e:
        print(f"⚠️  Git push failed: {e}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python screen_updater.py \"https://www.youtube.com/watch?v=XXXX\"")
        sys.exit(1)

    yt_url = sys.argv[1]
    print(f"📺  Grabbing frame from: {yt_url}")
    frame = grab_youtube_frame(yt_url)
    data  = extract_seats_from_image(frame)
    print(f"\n📦  Extracted:\n{json.dumps(data, indent=2)}\n")
    write_and_push(data)

    import shutil
    shutil.rmtree(os.path.dirname(frame), ignore_errors=True)

import sys
if __name__ == "__main__":
    main()