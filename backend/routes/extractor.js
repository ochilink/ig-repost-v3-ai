import express from 'express';
import axios from 'axios';
import { uploadBufferToS3 } from '../services/s3.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router = express.Router();

// Helper: try yt-dlp extraction (most reliable when IG blocks HTML scrape)
async function extractWithYtDlp(url){
  try {
    const { stdout } = await execAsync(`yt-dlp --no-warnings --get-url --format "mp4" "${url}"`, { timeout: 15000 });
    const videoUrl = stdout.trim().split('\n')[0];
    if(videoUrl && videoUrl.startsWith('http')){
      return videoUrl;
    }
    return null;
  } catch(e){
    console.log('yt-dlp failed:', e.message);
    return null;
  }
}

async function extractWithYtDlpMeta(url){
  try {
    const { stdout } = await execAsync(`yt-dlp --no-warnings --dump-json "${url}"`, { timeout: 15000 });
    const data = JSON.parse(stdout);
    return {
      video_url: data.url || data.formats?.[0]?.url,
      thumbnail: data.thumbnail,
      author: data.uploader || data.uploader_id,
      title: data.title
    };
  } catch(e){
    console.log('yt-dlp meta failed:', e.message);
    return null;
  }
}

// POST /api/extract - Universal Extractor: og:video + yt-dlp + oEmbed
router.post('/', async (req, res) => {
  try {
    const { url } = req.body;
    if(!url || !url.includes('instagram.com')) return res.status(400).json({ error: 'Valid instagram.com URL required' });
    const match = url.match(/\/(reel|p|reels)\/([A-Za-z0-9_-]+)/);
    if(!match) return res.status(400).json({ error: 'Could not parse shortcode' });
    const shortcode = match[2];
    console.log(`Extracting ${shortcode} from ${url}`);

    // Method 1: og:video scrape (fastest)
    try {
      const htmlRes = await axios.get(`https://www.instagram.com/reel/${shortcode}/`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15', 'Accept': 'text/html' },
        timeout: 10000
      });
      const html = htmlRes.data;
      const videoMatch = html.match(/<meta property="og:video" content="([^"]+)"/) || html.match(/"video_url":"([^"]+)"/);
      const thumbnailMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
      const authorMatch = html.match(/"username":"([^"]+)"/);
      if(videoMatch){
        let videoUrl = videoMatch[1].replace(/\\u0026/g, '&').replace(/\\u002F/g, '/').replace(/&amp;/g, '&');
        return res.json({ success: true, method: 'og:video', shortcode, video_url: videoUrl, thumbnail: thumbnailMatch ? thumbnailMatch[1] : null, author: authorMatch ? authorMatch[1] : null, original_url: url });
      }
    } catch(e){ console.log('og:video failed:', e.message); }

    // Method 2: yt-dlp fallback (reliable)
    console.log('Trying yt-dlp fallback...');
    const ytdlpResult = await extractWithYtDlpMeta(url);
    if(ytdlpResult?.video_url){
      return res.json({ success: true, method: 'yt-dlp', shortcode, video_url: ytdlpResult.video_url, thumbnail: ytdlpResult.thumbnail, author: ytdlpResult.author, title: ytdlpResult.title, original_url: url });
    }
    const simpleUrl = await extractWithYtDlp(url);
    if(simpleUrl){
      return res.json({ success: true, method: 'yt-dlp-simple', shortcode, video_url: simpleUrl, original_url: url });
    }

    // Method 3: oEmbed (preview only)
    try {
      const oembed = await axios.get(`https://graph.facebook.com/v21.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${process.env.IG_ACCESS_TOKEN}`);
      return res.json({ success: false, fallback: true, shortcode, oembed: oembed.data, error: 'IG blocked extraction - enable yt-dlp' });
    } catch(e2){
      throw new Error(`All methods failed: ${e2.message}`);
    }
  } catch(e){
    console.error(e.message);
    res.status(500).json({ error: e.message });
  }
});

router.post('/download', async (req,res)=>{
  try {
    const { video_url, shortcode } = req.body;
    if(!video_url) return res.status(400).json({ error: 'video_url required' });
    const videoRes = await axios.get(video_url, { responseType: 'arraybuffer', headers: { 'User-Agent': 'Mozilla/5.0' } });
    const buffer = Buffer.from(videoRes.data);
    const key = `reposts/${shortcode || Date.now()}.mp4`;
    const { S3_BUCKET } = process.env;
    if(S3_BUCKET && process.env.AWS_ACCESS_KEY_ID){
      const publicUrl = await uploadBufferToS3(buffer, key);
      return res.json({ success: true, s3_url: publicUrl, key, size: buffer.length });
    } else {
      return res.json({ success: true, size: buffer.length });
    }
  } catch(e){ res.status(500).json({ error: e.message }); }
});

export default router;