
# ig-repost-v3-ai - Universal Core v3 AI + Render.com + DchzgfFo3u8

Instagram Reel Extractor + AI Caption Writer + Auto Repost - Ready for Render.com deploy.

Tested with: https://www.instagram.com/reel/DchzgfFo3u8/?igsh=ZmY0azcycWowc2U5

## Features
- Extract ANY public reel via yt-dlp (og:video fallback)
- AI caption with thumbnail vision (gpt-4o-mini) or template fallback
- 4 tones: viral, professional, funny, motivational
- Niches: general, realestate, fitness, food, meme, business
- Download mp4 + copy caption + open Instagram (App Store safe)
- Auto-publish to YOUR Business IG via Graph API

## Deploy to Render.com

1. Fork this repo
2. Render.com -> New Web Service -> Connect repo
3. Runtime: Docker, Dockerfile: ./backend/Dockerfile
4. Add env: OPENAI_API_KEY (optional)
5. Deploy -> Test at /test-ai.html

## Endpoints
- POST /api/extract {url} -> {video_url, author, title, thumbnail, shortcode}
- POST /api/caption/ai-auto {extracted, niche} -> AI caption + 4 variations
- POST /api/caption/test {title, niche, tone, useAI} -> Test without IG link
- GET /test-ai.html -> Browser test for DchzgfFo3u8
- GET /health -> Health check

## Mobile App
Update BACKEND in mobile/screens/HomeScreen.js to your Render URL.

## Test Reel
https://www.instagram.com/reel/DchzgfFo3u8/

Paste in app -> Extract + AI Caption -> Download + Open IG -> Post to your profile.
