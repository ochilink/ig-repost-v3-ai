export function generateUniversalCaption({ 
  originalHandle = 'original',
  title = '',
  niche = 'general',
  tone = 'viral',
  includeHashtags = true,
  includeCredit = true,
  customText = '',
  address = '',
  city = '',
  price = '',
  beds = '',
  baths = ''
}){
  const credit = includeCredit ? `\n\nCredit: @${originalHandle} via Repost` : '';

  // Clean title
  const cleanTitle = title ? title.substring(0,100) : '';

  const hooks = {
    viral: [
      `🔥 This is INSANE! ${cleanTitle}`,
      `👀 Wait for it... ${cleanTitle}`,
      `💯 You NEED to see this!`,
      `🚨 STOP SCROLLING! ${cleanTitle}`,
      `This hit different 😳`
    ],
    professional: [
      `Sharing this valuable content from @${originalHandle}`,
      `Great insights from @${originalHandle} 👇`,
      `${cleanTitle || 'Valuable content'} - worth sharing`,
      `Thought this was worth reposting`
    ],
    funny: [
      `😂 @${originalHandle} did it again!`,
      `Not me watching this 10 times 🤣`,
      `Bro really said... 💀`,
      `${cleanTitle} - I'm crying 😭😂`
    ],
    motivational: [
      `💪 ${cleanTitle || 'Daily motivation'} from @${originalHandle}`,
      `Your reminder today 👇`,
      `Read this twice: ${cleanTitle}`,
      `This is your sign 🚀`
    ],
    realestate: [
      address ? `🚨 JUST LISTED - ${address}` : `🏠 New Listing Alert!`,
      `📍 ${address || city || 'Prime Location'}${price ? ` | 💵 ${price}` : ''}`,
      beds || baths ? `🛏️ ${beds || '?'} bd | 🛁 ${baths || '?'} ba` : ''
    ]
  };

  const nicheHashtags = {
    general: '#repost #viral #trending #explore #reels #foryou #fyp',
    realestate: '#RealEstate #Realtor #HomesForSale #HouseHunting #JustListed #Property #Investment #DreamHome',
    fitness: '#Fitness #Gym #Workout #Motivation #FitLife #Gains #FitnessReels #GymTok',
    food: '#Food #Foodie #Recipe #Cooking #FoodReels #Yummy #Delicious #FoodTok',
    fashion: '#Fashion #Style #OOTD #FashionReels #Outfit #Trend #FashionTok',
    motivational: '#Motivation #Mindset #Inspiration #Success #Quotes #DailyMotivation #MindsetMatters',
    meme: '#Meme #Funny #MemesDaily #LOL #Relatable #MemeReels #FunnyReels',
    business: '#Business #Entrepreneur #Hustle #Success #Money #BusinessTips #EntrepreneurLife',
    beauty: '#Beauty #Makeup #Skincare #BeautyTips #MakeupReels #BeautyTok'
  };

  let hook = '';
  let body = '';

  if (niche === 'realestate' && (address || city)) {
    hook = hooks.realestate[0];
    body = [
      hook,
      address || city ? `📍 ${address || city}` : '',
      (beds || baths || price) ? `🛏️ ${beds || '?'} bd | 🛁 ${baths || '?'} ba${price ? ` | 💵 ${price}` : ''}` : '',
      '',
      customText || 'DM for private tour or more info!',
      '',
      `Listing reposted from @${originalHandle}`
    ].filter(Boolean).join('\n');
  } else {
    // Pick random hook based on tone
    const toneHooks = hooks[tone] || hooks.viral;
    hook = toneHooks[Math.floor(Math.random() * toneHooks.length)];
    body = [
      hook,
      '',
      customText || (cleanTitle ? cleanTitle : `Amazing content from @${originalHandle} 🔥`),
      '',
      customText ? '' : `Follow @${originalHandle} for more!`
    ].filter(Boolean).join('\n');
  }

  let hashtags = '';
  if (includeHashtags) {
    hashtags = '\n\n' + (nicheHashtags[niche] || nicheHashtags.general);
  }

  return `${body}${hashtags}${credit}`.trim();
}

export function generateCaptionVariations(params){
  const tones = ['viral', 'professional', 'funny', 'motivational'];
  return tones.map(tone => ({
    tone,
    caption: generateUniversalCaption({ ...params, tone })
  }));
}