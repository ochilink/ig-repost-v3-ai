
# Deploy Universal Core v3 AI to Render.com - For Reel DchzgfFo3u8

## 1-Click Deploy

Your backend is ready with Dockerfile that includes yt-dlp + ffmpeg.

### Steps:

1. Push this folder to GitHub:
```
cd ig-repost-universal-core
git init
git add .
git commit -m "v3 AI - DchzgfFo3u8 ready"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ig-repost-v3-ai.git
git push -u origin main
```

2. Go to https://dashboard.render.com -> New Web Service -> Connect GitHub repo

3. Settings:
- Environment: Docker
- Dockerfile: ./backend/Dockerfile
- Plan: Starter ($7/mo) or Free
- Health check: /health

4. Add Environment Variables in Render Dashboard:
- OPENAI_API_KEY=sk-proj-... (optional, for AI vision - else template works)
- IG_ACCESS_TOKEN= (optional, for oEmbed)
- PORT=8000 (auto-set by Render)

5. Deploy -> Wait 2-3 mins (installs yt-dlp)

6. Test your reel:
```
curl https://your-app.onrender.com/api/extract -X POST -H "Content-Type: application/json" -d '{"url":"https://www.instagram.com/reel/DchzgfFo3u8/"}'
```

Should return: {video_url, thumbnail, author, method: yt-dlp}

7. Test AI caption:
```
curl https://your-app.onrender.com/api/caption/test -X POST -H "Content-Type: application/json" -d '{"title":"Reel DchzgfFo3u8","niche":"general","tone":"viral","useAI":false}'
```

8. Update mobile app BACKEND URL:
In mobile/screens/HomeScreen.js:
```
const BACKEND = 'https://your-app.onrender.com';
```

9. Build APK/IPA and test that reel:
- Paste https://www.instagram.com/reel/DchzgfFo3u8/?igsh=ZmY0azcycWowc2U5
- Tap "Extract DchzgfFo3u8 + AI Caption"
- Downloads video + writes caption + opens Instagram

## Why Dockerfile has yt-dlp?

Instagram blocks og:video scrape on Render IPs. yt-dlp bypasses it and gets direct mp4 URL. Dockerfile installs:
- python3 + pip3
- yt-dlp (pip)
- ffmpeg (for processing)

## Cost:
- Render Starter: $7/mo (includes yt-dlp, always on)
- OpenAI gpt-4o-mini: ~$0.0005 per caption (thumbnail vision low-res)
- Template fallback: FREE (no OpenAI key needed)

## Test page:
Once deployed, open:
https://your-app.onrender.com/test-ai.html

Pre-filled with DchzgfFo3u8 for testing.
