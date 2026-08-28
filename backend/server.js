import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/temp', express.static('temp'));
app.use(express.static(__dirname));

let igRoutes, extractorRoutes, captionRoutes;

try {
  const ig = await import('./instagram.js');
  igRoutes = ig.default;
} catch {
  const ig = await import('./routes/instagram.js');
  igRoutes = ig.default;
}

try {
  const ex = await import('./extractor.js');
  extractorRoutes = ex.default;
} catch {
  const ex = await import('./routes/extractor.js');
  extractorRoutes = ex.default;
}

try {
  const cap = await import('./caption.js');
  captionRoutes = cap.default;
} catch {
  const cap = await import('./routes/caption.js');
  captionRoutes = cap.default;
}

app.use('/api/instagram', igRoutes);
app.use('/api/extract', extractorRoutes);
app.use('/api/caption', captionRoutes);

app.get('/', (req,res)=> res.json({ 
  ok:true, 
  msg:'Universal Core v3 AI - DchzgfFo3u8 Ready - Render.com Live FLAT FIX',
  version:'universal-core-v3-ai-render-flat',
  deployed: 'Render.com + yt-dlp + OpenAI Vision',
  fix: 'flat+routes dual import',
  endpoints: [
    'POST /api/extract {url} -> {video_url, author, title, thumbnail}',
    'POST /api/caption/ai-auto {extracted, niche} -> AI caption',
    'GET /test-ai.html -> Browser test for DchzgfFo3u8',
    'POST /api/instagram/repost {video_url, caption}'
  ],
  currentReel: 'DchzgfFo3u8'
}));

app.get('/health', (req,res)=> res.json({ ok:true, ytDlp: true, openai: !!process.env.OPENAI_API_KEY, version: 'v3-ai-flat' }));

const PORT = process.env.PORT || 8000;
app.listen(PORT, ()=> console.log(V3 AI FLAT FIX LIVE on  - DchzgfFo3u8 ready));
