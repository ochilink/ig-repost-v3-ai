import express from 'express';
import { generateUniversalCaption, generateCaptionVariations } from '../services/universalCaptionGenerator.js';
const router = express.Router();

// POST /api/caption/generate - Auto-writer for ANY niche
router.post('/generate', (req,res)=>{
  try {
    const { 
      originalHandle = 'original',
      title = '',
      niche = 'general',
      tone = 'viral',
      customText = '',
      address = '',
      city = '',
      price = '',
      beds = '',
      baths = '',
      includeHashtags = true
    } = req.body;

    const caption = generateUniversalCaption({
      originalHandle,
      title,
      niche,
      tone,
      customText,
      address,
      city,
      price,
      beds,
      baths,
      includeHashtags
    });

    res.json({ success: true, caption, niche, tone, params: req.body });
  } catch(e){
    res.status(500).json({ error: e.message });
  }
});

// POST /api/caption/variations - Get 4 styles at once (viral, professional, funny, motivational)
router.post('/variations', (req,res)=>{
  try {
    const variations = generateCaptionVariations(req.body);
    res.json({ success: true, variations });
  } catch(e){
    res.status(500).json({ error: e.message });
  }
});

// POST /api/caption/auto - Auto-detect from extracted data
router.post('/auto', (req,res)=>{
  try {
    const { extracted, niche = 'general', customText = '' } = req.body;
    // extracted comes from /api/extract: {author, title, video_url}
    const caption = generateUniversalCaption({
      originalHandle: extracted?.author || 'original',
      title: extracted?.title || '',
      niche,
      tone: 'viral',
      customText,
      includeHashtags: true
    });
    const variations = generateCaptionVariations({
      originalHandle: extracted?.author || 'original',
      title: extracted?.title || '',
      niche,
      customText
    });
    res.json({ success: true, caption, variations, extracted });
  } catch(e){
    res.status(500).json({ error: e.message });
  }
});

export default router;