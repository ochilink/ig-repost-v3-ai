
import axios from 'axios';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
function fallbackCaption({ author, title, niche, tone }){
  const tones = {
    viral: `🔥 This from @${author} is INSANE! ${title || 'You need to see this'} 👀`,
    professional: `Great insights from @${author} - ${title || 'Worth sharing'} 👇`,
    funny: `😂 @${author} did it again! ${title || 'Not me watching this 10 times'}`,
    motivational: `💪 ${title || 'Daily motivation'} from @${author} - Your reminder today 🚀`
  };
  return tones[tone] || tones.viral;
}
export async function generateAICaption({ thumbnailUrl=null, title='', author='original', niche='general', tone='viral', customText='', includeHashtags=true }){
  if(!OPENAI_API_KEY){
    return { caption: fallbackCaption({ author, title, niche, tone }) + `\n\n#${niche} #repost #viral\n\nCredit: @${author}`, method: 'template-fallback', usedAI: false };
  }
  try {
    const systemPrompt = `You are expert IG caption writer. Niche: ${niche}. Tone: ${tone}. Write viral caption under 150 words. Include hashtags for ${niche}. ${customText ? `Include: ${customText}` : ''} Credit @${author} at end.`;
    let userText = `Title: "${title || 'No title'}". Author: @${author}. Niche: ${niche}. Tone: ${tone}. Write 1 caption.`;
    let messages = [{ role: 'system', content: systemPrompt }];
    if(thumbnailUrl){
      messages.push({ role: 'user', content: [{ type: 'text', text: userText + ' Analyze thumbnail.' }, { type: 'image_url', image_url: { url: thumbnailUrl, detail: 'low' } }] });
    } else {
      messages.push({ role: 'user', content: userText });
    }
    const response = await axios.post('https://api.openai.com/v1/chat/completions', { model: 'gpt-4o-mini', messages, max_tokens: 300, temperature: 0.8 }, { headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' } });
    return { caption: response.data.choices[0].message.content, method: thumbnailUrl ? 'openai-vision' : 'openai-text', usedAI: true, model: 'gpt-4o-mini', thumbnailAnalyzed: !!thumbnailUrl };
  } catch(e){
    return { caption: fallbackCaption({ author, title, niche, tone }) + `\n\n#${niche} #repost\n\nCredit: @${author}`, method: 'template-fallback-error', usedAI: false, error: e.message };
  }
}
export async function generateAIVariations({ thumbnailUrl, title, author, niche, customText }){
  const tones = ['viral', 'professional', 'funny', 'motivational'];
  const results = [];
  for(const tone of tones){
    const result = await generateAICaption({ thumbnailUrl, title, author, niche, tone, customText });
    results.push({ tone, ...result });
    await new Promise(r => setTimeout(r, 200));
  }
  return results;
}
