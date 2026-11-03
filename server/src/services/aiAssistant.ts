import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../models/dataStore.js';
import { IProduct } from '../types/index.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AssistantResponse {
  message: string;
  recommendedProducts: {
    id: string;
    name: string;
    slug: string;
    packSize: string;
    pricePaise: number;
    image: string;
    category: string;
  }[];
  isAiFallback: boolean;
  suggestedFollowUps?: string[];
}

export async function processAssistantChat(
  userQuery: string,
  history: ChatMessage[] = []
): Promise<AssistantResponse> {
  const products = db.getProducts().filter(p => p.isPublished);
  const settings = db.getSettings();
  const q = userQuery.toLowerCase().trim();
  const apiKey = (process.env.GEMINI_API_KEY || GEMINI_API_KEY || '').trim();

  // --- 1. DIRECT INTENT INTERCEPT: ACCEPTED PAYMENT OPTIONS ---
  const isPaymentQuery = /\b(payments?|how to pay|pay options?|accepted payment|payment methods?|pay with|cards?|cod|cash on delivery|razorpay|upi|gpay|phonepe|paytm|bhim|netbanking|credit cards?|debit cards?)\b/i.test(q) &&
    !/(tea|spice|pepper|cardamom|buy|order now|cost of|cinnamon|clove)/i.test(q);

  if (isPaymentQuery) {
    const freeShipThreshold = (settings.freeShippingThresholdPaise / 100).toFixed(0);
    return {
      message: `Namaste! We support convenient, secure payment options across Spice Roots:\n\n1. ⚡ **Direct Manual UPI Transfer (Zero Fees)**: Pay directly via Google Pay, PhonePe, Paytm, BHIM, or any UPI app to our merchant UPI ID (\`${settings.merchantUpiId || 'cynalbertoz@sbi'}\`). Upload your payment screenshot or enter your 12-digit UTR at checkout for instant verification.\n\n2. 💵 **Cash on Delivery (COD)**: Available pan-India. Pay in cash or scan-and-pay upon delivery at your doorstep.\n\n3. 💳 **Online Cards & Net Banking**: All major Indian credit & debit cards (Visa, MasterCard, RuPay, Amex) and 50+ net banking portals with 256-bit bank-grade encryption.\n\n📦 *Orders above ₹${freeShipThreshold} qualify for Free Express Shipping.*`,
      recommendedProducts: [],
      isAiFallback: false,
      suggestedFollowUps: [
        'Recommend an evening tea',
        'Find spices for biryani',
        'What is your shipping policy?',
        'Show best-selling spices'
      ]
    };
  }

  // --- 2. RETRIEVAL-AUGMENTED GENERATION (RAG) WITH GEMINI ---
  if (apiKey && apiKey.length > 10) {
    // Model candidates in priority order (Google Generative AI updated API)
    const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];

    // Grounding catalog summary
    const catalogSummary = products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category,
      variants: p.variants.map(v => `${v.packSize}: ₹${(v.pricePaise / 100).toFixed(0)} (Stock: ${v.stock})`),
      shortDescription: p.shortDescription,
      description: p.description,
      origin: p.origin,
      tags: p.tags
    }));

    const systemPrompt = `You are "Spice Roots Concierge", an authoritative yet warm, welcoming culinary advisor and shopping assistant for Spice Roots (Kalaivani Spices & Plantation Depot), Munnar, Kerala, India.

YOUR MISSION:
Delight customers, recommend authentic single-origin spices and high-mountain Munnar teas, provide culinary guidance, and actively boost sales by showcasing our products.

BRAND IDENTITY & TERROIR:
- Direct plantation harvest from Kerala's Western Ghats: Idukki (black pepper & cardamom), Wayanad (cloves), Munnar (single-estate orthodox & CTC teas at up to 7,900 ft), and Alleppey.
- 100% pure, sun-cured, natural essential-oil rich, unadulterated, free of synthetic additives or essences.

STORE POLICIES:
- Free Shipping threshold: ₹${(settings.freeShippingThresholdPaise / 100).toFixed(0)} pan-India. (Standard delivery ₹${(settings.standardShippingFeePaise / 100).toFixed(0)}).
- Fast Dispatch: 24-48 business hours via Blue Dart, DTDC, India Post (3-6 business days delivery).
- Payment Options: Direct UPI (merchant ID: ${settings.merchantUpiId || 'cynalbertoz@sbi'}), Cash on Delivery (COD), or Credit/Debit Cards.
- Guarantee: 7-day replacement guarantee for damaged or incorrect items.

HOW TO ANSWER CUSTOMER QUESTIONS:
1. GREETINGS & GENERAL INQUIRIES ("Hi", "Hello", "What do you sell?", "Help me choose", "Best sellers"):
   - Welcome the customer warmly ("Namaste!").
   - Introduce Spice Roots and briefly highlight our star collections: Alleppey 8mm Green Cardamom, Malabar Tellicherry Pepper, Kolukkumalai Orthodox Tea, and the Western Ghats Spice Discovery Wooden Casket.
   - Recommend 2-3 top sellers and invite them to ask about recipes or specific tastes.

2. CULINARY & SPICE QUESTIONS (Biryani, curries, chai, marinades, health, storage):
   - Provide sommelier-grade culinary pairing tips (e.g., tempering whole spices in ghee, whole spice vs ground masala, brewing methods).
   - Confidently recommend the exact items from the LIVE CATALOG below with their benefits and prices.

3. TEA RECOMMENDATIONS:
   - Evening / Relaxing cup -> Kolukkumalai High-Peak Orthodox Black Tea (prod_kolukkumalai_tea, 7,900 ft, golden liquor, natural muscatel honey notes).
   - Morning / Daily Kadak Chai -> Thalayar Estate Rich CTC Leaf Tea (prod_thalayar_tea) paired with Alleppey Cardamom or Wayanad Cloves.
   - Rare Connoisseur White Tea -> Munnar White Tea Silver Tips (prod_white_tea_tips).

4. OFF-TOPIC OR NON-STORE QUERIES (Coding, software, politics, world trivia, math homework, sports):
   - Politely and gracefully deflect with warmth:
     "Namaste! While I specialize in authentic Western Ghats spices, Munnar teas, and Spice Roots orders rather than general trivia or coding, I would love to help you find the finest spices or teas for your kitchen! Are you looking for bold spices for cooking or a soothing tea today?"
   - Do NOT be rude, robotic, or overly defensive. Keep it friendly, brief, and guide them back to our spices and teas.

5. PRODUCT RECOMMENDATION FORMAT:
Whenever you recommend products, ALWAYS append their exact product IDs at the very end of your response in this exact format:
[[RECOMMENDATIONS: ["prod_id1", "prod_id2"]]]

LIVE CATALOG:
${JSON.stringify(catalogSummary)}`;

    const genAI = new GoogleGenerativeAI(apiKey);

    // Build conversation context
    const recentHistory = (history || [])
      .slice(-6)
      .map(m => `${m.role === 'user' ? 'Customer' : 'Spice Roots Concierge'}: ${m.content}`)
      .join('\n');

    const promptWithHistory = recentHistory
      ? `${recentHistory}\nCustomer: ${userQuery}`
      : `Customer: ${userQuery}`;

    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt
        });
        const result = await model.generateContent(promptWithHistory);
        const rawText = result.response.text();

        // Extract recommended product IDs
        const match = rawText.match(/\[\[RECOMMENDATIONS:\s*(\[.*?\])\s*\]\]/);
        let recommendedIds: string[] = [];
        let cleanMessage = rawText;

        if (match && match[1]) {
          try {
            recommendedIds = JSON.parse(match[1]);
            cleanMessage = rawText.replace(match[0], '').trim();
          } catch {
            // fallback
          }
        }

        // If LLM didn't include bracket tags or query is product-related, extract dynamically
        if (recommendedIds.length === 0) {
          recommendedIds = findMatchingProductIds(userQuery + ' ' + cleanMessage, products);
        }

        // Ensure IDs exist in actual products
        const recProducts = products
          .filter(p => recommendedIds.includes(p.id || ''))
          .slice(0, 3)
          .map(p => {
            const firstVariant = p.variants[0];
            return {
              id: p.id || '',
              name: p.name,
              slug: p.slug,
              packSize: firstVariant ? firstVariant.packSize : '100 g',
              pricePaise: firstVariant ? firstVariant.pricePaise : 0,
              image: p.images[0] || '',
              category: p.category
            };
          });

        return {
          message: cleanMessage,
          recommendedProducts: recProducts,
          isAiFallback: false,
          suggestedFollowUps: generateFollowUps(userQuery)
        };
      } catch (err) {
        console.warn(`⚠️ [Gemini AI (${modelName})] Error: ${(err as Error).message}. Trying next candidate...`);
      }
    }
  }

  // --- 3. STRUCTURED RAG CATALOG ENGINE (Deterministic, Grounded Fallback) ---
  return buildStructuredCatalogResponse(userQuery, products, settings);
}

function generateFollowUps(query: string): string[] {
  const q = query.toLowerCase();
  if (q.includes('tea') || q.includes('evening') || q.includes('brew')) {
    return ['How to brew orthodox tea?', 'What elevation is Kolukkumalai?', 'Accepted payment options'];
  }
  if (q.includes('biryani') || q.includes('masala')) {
    return ['What size garam masala is best?', 'Do you have whole star anise?', 'Check free shipping policy'];
  }
  if (q.includes('payment') || q.includes('pay') || q.includes('cod')) {
    return ['How do I get free shipping?', 'Recommend an evening tea', 'Which pepper should I buy?'];
  }
  return ['Recommend an evening tea', 'Which pepper should I buy?', 'Accepted payment options', 'Show products under ₹500'];
}

function findMatchingProductIds(query: string, products: IProduct[]): string[] {
  const q = query.toLowerCase();

  // Special cases for high-intent queries
  if (q.includes('evening') && (q.includes('tea') || q.includes('recommend') || q.includes('brew'))) {
    return ['prod_kolukkumalai_tea', 'prod_white_tea_tips'];
  }
  if ((q.includes('morning') || q.includes('kadak') || q.includes('chai') || q.includes('milk tea')) && (q.includes('tea') || q.includes('chai'))) {
    return ['prod_thalayar_tea', 'prod_green_cardamom_8mm'];
  }
  if (q.includes('biryani') || q.includes('curry') || q.includes('pulao') || q.includes('meat') || q.includes('chicken') || q.includes('masala')) {
    return ['prod_kerala_garam_masala', 'prod_green_cardamom_8mm', 'prod_ceylon_cinnamon', 'prod_clove_wayanad'];
  }
  if (q.includes('gift') || q.includes('box') || q.includes('casket') || q.includes('hamper')) {
    return ['prod_heritage_spice_box', 'prod_roasted_almond_chocolate'];
  }
  if (q.includes('oil') || q.includes('lemongrass') || q.includes('coconut')) {
    return ['prod_lemongrass_oil', 'prod_coconut_oil_cold_pressed'];
  }

  // Keyword to product mapping
  const keywordMap: { [key: string]: string } = {
    'cardamom': 'prod_green_cardamom_8mm',
    'elaichi': 'prod_green_cardamom_8mm',
    'pepper': 'prod_black_pepper',
    'tellicherry': 'prod_black_pepper',
    'cinnamon': 'prod_ceylon_cinnamon',
    'dalchini': 'prod_ceylon_cinnamon',
    'clove': 'prod_clove_wayanad',
    'laung': 'prod_clove_wayanad',
    'star anise': 'prod_star_anise',
    'chakriphool': 'prod_star_anise',
    'mace': 'prod_mace_nutmeg',
    'nutmeg': 'prod_mace_nutmeg',
    'javitri': 'prod_mace_nutmeg',
    'jaiphal': 'prod_mace_nutmeg',
    'pathimugam': 'prod_pathimugam',
    'sappan': 'prod_pathimugam',
    'orthodox': 'prod_kolukkumalai_tea',
    'kolukkumalai': 'prod_kolukkumalai_tea',
    'thalayar': 'prod_thalayar_tea',
    'ctc': 'prod_thalayar_tea',
    'white tea': 'prod_white_tea_tips',
    'silver tips': 'prod_white_tea_tips',
    'lemongrass': 'prod_lemongrass_oil',
    'coconut oil': 'prod_coconut_oil_cold_pressed',
    'gift box': 'prod_heritage_spice_box',
    'wooden': 'prod_heritage_spice_box',
    'chocolate': 'prod_roasted_almond_chocolate',
    'garam masala': 'prod_kerala_garam_masala'
  };

  const detected: string[] = [];
  for (const [kw, prodId] of Object.entries(keywordMap)) {
    if (q.includes(kw) && !detected.includes(prodId)) {
      detected.push(prodId);
    }
  }

  if (detected.length > 0) {
    return detected;
  }

  // General fuzzy match across product fields
  const matched = products.filter(p => {
    const inName = p.name.toLowerCase().includes(q) || q.includes(p.name.toLowerCase().split(' ')[0]);
    const inDesc = p.shortDescription.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    const inIngr = p.ingredients?.some(i => i.toLowerCase().includes(q) || q.includes(i.toLowerCase()));
    const inTags = p.tags?.some(t => t.toLowerCase().includes(q) || q.includes(t.toLowerCase()));
    const inCat = p.category.toLowerCase().includes(q) || q.includes(p.category.toLowerCase());
    return inName || inDesc || inIngr || inTags || inCat;
  });

  if (matched.length > 0) {
    return matched.map(m => m.id || '');
  }

  // Default fallback popular catalog items
  return ['prod_green_cardamom_8mm', 'prod_black_pepper', 'prod_kolukkumalai_tea'];
}

function buildStructuredCatalogResponse(query: string, products: IProduct[], settings: any): AssistantResponse {
  const q = query.toLowerCase().trim();
  let text = '';
  let matchedIds: string[] = [];
  let followUps: string[] = [];

  // 1. SPECIFIC EVENING TEA INTENT
  if (q.includes('evening') && (q.includes('tea') || q.includes('brew') || q.includes('chai') || q.includes('recommend') || q.includes('drink'))) {
    text = `For a serene evening tea ritual, we highly recommend our single-estate **Kolukkumalai High-Peak Orthodox Black Tea**.\n\nHarvested at 7,900 ft from the highest tea plantation on earth, it is crafted using traditional 1930s orthodox rolling methods. Its clear golden amber liquor carries natural notes of mountain honey and muscatel—gentle, refreshing, and calming on the palate without heavy bitterness.`;
    matchedIds = ['prod_kolukkumalai_tea'];
    followUps = [
      'How do I brew orthodox whole leaf tea?',
      'Accepted payment options',
      'What are your shipping charges?'
    ];
  }
  // 2. MORNING TEA / KADAK CHAI INTENT
  else if (q.includes('morning') && (q.includes('tea') || q.includes('chai')) || q.includes('kadak') || q.includes('milk tea') || q.includes('ctc')) {
    text = `For an invigorating morning cup or robust afternoon chai, our **Thalayar Estate Rich CTC Leaf Tea** is harvested fresh from Munnar's high elevation. It produces a brisk, full-bodied liquor that pairs wonderfully with warm milk and crushed Alleppey green cardamom or Wayanad cloves.`;
    matchedIds = ['prod_thalayar_tea', 'prod_green_cardamom_8mm'];
    followUps = ['Recommend an evening tea', 'Show spices for chai masala', 'Accepted payment options'];
  }
  // 3. GENERAL TEA QUERY
  else if (q.includes('tea') || q.includes('chai')) {
    text = `Spice Roots curates authentic single-estate teas directly from the mist-covered peaks of Munnar:\n\n• **Kolukkumalai High-Peak Orthodox Black Tea** (7,900 ft) — Soothing evening whole leaf with natural muscatel honey notes.\n• **Thalayar Estate Rich CTC Leaf Tea** — Brisk, copper-toned cup crafted for authentic morning milk chai.\n• **Munnar White Tea Silver Tips** — Rare hand-plucked tender buds with delicate floral sweetness.`;
    matchedIds = ['prod_kolukkumalai_tea', 'prod_thalayar_tea', 'prod_white_tea_tips'];
    followUps = ['Recommend an evening tea', 'What is the elevation of Kolukkumalai?', 'Accepted payment options'];
  }
  // 4. BIRYANI / GARAM MASALA INTENT
  else if (q.includes('biryani') || q.includes('pulao') || q.includes('chicken') || q.includes('mutton') || q.includes('curry')) {
    text = `For authentic Malabar Dum Biryani, whole sun-dried spices deliver royal aroma and deep warmth:\n\n• **Alleppey Green Cardamom (8mm Bold)**: Intense camphoraceous sweetness.\n• **Handcrafted Ceylon Cinnamon Quills**: True soft-bark cinnamon with gentle floral sweetness.\n• **High-Eugenol Wayanad Clove Buds**: Potent aromatic spice with high essential oil content.\n• **Royal Malabar Garam Masala**: Stone-ground whole spice blend for authentic biryani dum.`;
    matchedIds = ['prod_green_cardamom_8mm', 'prod_ceylon_cinnamon', 'prod_clove_wayanad', 'prod_kerala_garam_masala'];
    followUps = ['Do you have black pepper?', 'What is your shipping policy?', 'Accepted payment options'];
  }
  // 5. PEPPER INTENT
  else if (q.includes('pepper') || q.includes('tellicherry') || q.includes('black pepper')) {
    text = `Our **Malabar Tellicherry Black Pepper (Garbled)** is hand-sorted in Idukki to ensure bold 4.5mm berries. Rich in piperine and natural essential oils, it delivers a crisp citrus burst followed by deep, clean mountain heat. Available in 100g, 250g, and 500g packs.`;
    matchedIds = ['prod_black_pepper'];
    followUps = ['What sizes are available?', 'Show green cardamom', 'Accepted payment options'];
  }
  // 6. CARDAMOM INTENT
  else if (q.includes('cardamom') || q.includes('elaichi')) {
    text = `Our **Alleppey Green Cardamom — 8mm Super Bold** represents the top harvest from the high ranges. Each pod is intensely green, packed with oily jet-black seeds, and offers extraordinary aromatic sweetness. Available in 50g, 100g, and 250g packs.`;
    matchedIds = ['prod_green_cardamom_8mm'];
    followUps = ['Recommend tea to pair with cardamom', 'Show Ceylon cinnamon', 'Accepted payment options'];
  }
  // 7. CINNAMON INTENT
  else if (q.includes('cinnamon') || q.includes('dalchini')) {
    text = `Our **Handcrafted Ceylon Roll Cinnamon Quills** are authentic *Cinnamomum verum* (true cinnamon), distinguished by delicate multiple-layered paper-thin quills with low coumarin content, offering sweet woody fragrance without harsh cassia pungency.`;
    matchedIds = ['prod_ceylon_cinnamon'];
    followUps = ['Show green cardamom', 'Find spices for biryani', 'Accepted payment options'];
  }
  // 8. STORAGE & SHELF LIFE
  else if (q.includes('store') || q.includes('shelf') || q.includes('keep') || q.includes('expire')) {
    text = `🌿 **Spice Storage Golden Rules from Kerala Planters:**\n\n1. Store in airtight amber glass jars away from direct sun and heat.\n2. Never shake spice jars directly over steaming pots (moisture ruins essential oils).\n3. Whole spices retain peak potency for 12–18 months; teas retain aroma for up to 12 months in sealed caskets.`;
    matchedIds = ['prod_black_pepper', 'prod_green_cardamom_8mm'];
    followUps = ['Which whole spices do you sell?', 'Accepted payment options'];
  }
  // 9. SHIPPING & LOGISTICS
  else if (q.includes('shipping') || q.includes('delivery') || q.includes('courier') || q.includes('track')) {
    const freeThresh = (settings.freeShippingThresholdPaise / 100).toFixed(0);
    const fee = (settings.standardShippingFeePaise / 100).toFixed(0);
    text = `📦 **Shipping & Delivery:**\n• Free shipping across India on orders above ₹${freeThresh} (standard fee ₹${fee}).\n• Parcels are dispatched within 24-48 business hours from our Munnar depot via Blue Dart Express, Delhivery, and DTDC.\n• Estimated pan-India delivery time: 3 to 6 business days with real-time AWB tracking.`;
    matchedIds = ['prod_black_pepper', 'prod_kolukkumalai_tea'];
    followUps = ['Accepted payment options', 'Recommend an evening tea', 'Track my order'];
  }
  // 10. DEFAULT WELCOME / DISCOVERY
  else {
    text = `Namaste! Welcome to **Spice Roots** (Kalaivani Spices & Plantation Depot). Sourced directly from our generational plantation partners across Munnar, Idukki, and Wayanad, I am here to help you discover authentic single-origin spices, rare high-mountain teas, or assist with your orders.\n\nHere are some of our most celebrated harvests:`;
    matchedIds = ['prod_green_cardamom_8mm', 'prod_black_pepper', 'prod_kolukkumalai_tea'];
    followUps = [
      'Recommend an evening tea',
      'Accepted payment options',
      'Find spices for biryani',
      'Tell me about Tellicherry pepper'
    ];
  }

  const recProducts = products
    .filter(p => matchedIds.includes(p.id || ''))
    .slice(0, 3)
    .map(p => {
      const firstVariant = p.variants[0];
      return {
        id: p.id || '',
        name: p.name,
        slug: p.slug,
        packSize: firstVariant ? firstVariant.packSize : '100 g',
        pricePaise: firstVariant ? firstVariant.pricePaise : 0,
        image: p.images[0] || '',
        category: p.category
      };
    });

  return {
    message: text,
    recommendedProducts: recProducts,
    isAiFallback: true,
    suggestedFollowUps: followUps
  };
}
