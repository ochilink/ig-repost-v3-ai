import express from 'express';
import axios from 'axios';
import { uploadBufferToS3 } from '../services/s3.js';

const router = express.Router();
const GRAPH = 'https://graph.facebook.com/v21.0';

// Helper: poll container status
async function pollContainer(containerId, token, maxTries=20) {
  for(let i=0;i<maxTries;i++){
    const { data } = await axios.get(`${GRAPH}/${containerId}`, {
      params: { fields: 'status_code,status', access_token: token }
    });
    console.log(`Container ${containerId} status:`, data.status_code);
    if(data.status_code === 'FINISHED') return true;
    if(data.status_code === 'ERROR') throw new Error(`Container error: ${JSON.stringify(data)}`);
    await new Promise(r=>setTimeout(r, 3000));
  }
  throw new Error('Container polling timeout');
}

// POST /api/instagram/repost
// body: { video_url (public mp4), caption, originalHandle }
router.post('/repost', async (req,res)=>{
  try {
    const { video_url, caption, originalHandle } = req.body;
    const IG_ID = process.env.IG_USER_ID;
    const TOKEN = process.env.IG_ACCESS_TOKEN;

    if(!video_url) return res.status(400).json({ error:'video_url required - public mp4 url' });

    const finalCaption = `${caption || ''}\n\nCredit: @${originalHandle || 'original'} via Repost App`.trim();

    // 1. Create REELS container
    console.log('Creating container for', video_url);
    const createRes = await axios.post(`${GRAPH}/${IG_ID}/media`, null, {
      params: {
        media_type: 'REELS',
        video_url: video_url,
        caption: finalCaption,
        share_to_feed: true,
        access_token: TOKEN
      }
    });

    const creationId = createRes.data.id;
    console.log('Creation ID:', creationId);

    // 2. Poll
    await pollContainer(creationId, TOKEN);

    // 3. Publish
    const publishRes = await axios.post(`${GRAPH}/${IG_ID}/media_publish`, null, {
      params: { creation_id: creationId, access_token: TOKEN }
    });

    res.json({ success:true, creationId, publishedId: publishRes.data.id });
  } catch(e){
    console.error(e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data || e.message });
  }
});

// POST /api/instagram/upload-and-repost - upload local mp4 then repost
router.post('/upload-and-repost', express.raw({ type:'video/mp4', limit:'100mb' }), async (req,res)=>{
  try {
    const IG_ID = process.env.IG_USER_ID;
    const TOKEN = process.env.IG_ACCESS_TOKEN;
    const caption = req.headers['x-caption'] || 'Reposted video';

    const key = `reposts/${Date.now()}.mp4`;
    const publicUrl = await uploadBufferToS3(req.body, key);
    console.log('Uploaded to S3:', publicUrl);

    // Reuse same flow
    const createRes = await axios.post(`${GRAPH}/${IG_ID}/media`, null, {
      params: {
        media_type: 'REELS',
        video_url: publicUrl,
        caption,
        share_to_feed: true,
        access_token: TOKEN
      }
    });
    const creationId = createRes.data.id;
    await pollContainer(creationId, TOKEN);
    const publishRes = await axios.post(`${GRAPH}/${IG_ID}/media_publish`, null, {
      params: { creation_id: creationId, access_token: TOKEN }
    });

    res.json({ success:true, s3Url: publicUrl, publishedId: publishRes.data.id });
  } catch(e){
    console.error(e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data || e.message });
  }
});

// GET media for logged in user (your own videos)
router.get('/my-media', async (req,res)=>{
  try {
    const { data } = await axios.get(`${GRAPH}/${process.env.IG_USER_ID}/media`, {
      params: {
        fields: 'id,media_type,media_url,thumbnail_url,permalink,caption,timestamp',
        limit: 25,
        access_token: process.env.IG_ACCESS_TOKEN
      }
    });
    res.json(data);
  } catch(e){
    res.status(500).json({ error: e.response?.data || e.message });
  }
});

export default router;