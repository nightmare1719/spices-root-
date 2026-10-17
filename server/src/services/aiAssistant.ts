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

  // --- 1. DIRECT INTENT INTERCEPT: ACCEPTED PAYMENT OPTIONS ---
  const isPaymentQuery = /\b(payments?|how to pay|pay options?|accepted payment|payment methods?|pay with|cards?|cod|cash on delivery|razorpay|upi|netbanking|credit cards?|debit cards?)\b/i.test(q) &&
    !/(tea|spice|pepper|cardamom|buy|order now|cost of)/i.test(q);

  if (isPaymentQuery) {
    const freeShipThreshold = (settings.freeShippingThresholdPaise / 100).toFixed(0);
    return {
      message: `We accept the following secure, verified payment options across all orders at Spice Roots:\n\n1. 💵 **Cash on Delivery (COD)**: Available pan-India. Pay in cash or scan-and-pay via UPI upon delivery directly at your doorstep.\n\n2. ⚡ **Pay with Razorpay**: Instant online checkout supporting UPI (Google Pay, PhonePe, Paytm, BHIM), Net Banking across 50+ Indian banks, and digital wallets.\n\n3. 💳 **Pay with Cards**: All major Indian and International Credit & Debit Cards (Visa, MasterCard, RuPay, and American Express) with bank-grade 256-bit encryption.\n\n📦 *Orders above ₹${freeShipThreshold} automatically qualify for Free Express Shipping.*`,
      recommendedProducts: [],
      isAiFallback: false,
      suggestedFollowUps: [
        'Recommend an evening tea',
        'Find spices for biryani',
        'What is the shipping policy?',
        'Show products under ₹500'
      ]
    };
  }

  // --- 1.5 DIRECT INTENT INTERCEPT: IRRELEVANT OR UNWANTED QUESTIONS ---
  const isExplicitOffTopic = /(write code|coding|javascript|python|html|css|sql|software|debug|politics|election|president|prime minister|celebrity|movie|actor|cricket match|football|cryptocurrency|bitcoin|ethereum|stocks|forex|joke|sing a song|poem|essay|homework|weather in (new york|london|delhi|mumbai|paris|tokyo)|hack|jailbreak)/i.test(q);
  const isStoreRelated = /(spice|pepper|cardamom|cinnamon|clove|star anise|mace|nutmeg|pathimugam|tea|chai|orthodox|ctc|brew|evening|morning|kolukkumalai|thalayar|munnar|kerala|ghats|order|ship|deliver|track|pay|payment|cod|razorpay|card|price|cost|discount|coupon|cart|checkout|return|policy|store|gift|box|casket|chocolate|oil|lemongrass|coconut|stock|sample|flavor|taste|ingredient|origin|recipe|biryani|curry|food|pulao|hi|hello|hey|namaste|help)/i.test(q);

  if (isExplicitOffTopic || (!isStoreRelated && q.split(/\s+/).length > 2)) {
    return {
      message: `Thank you for reaching out! I am the **Spice Roots Concierge**, dedicated exclusively to assisting you with our authentic Kerala spices, single-estate Munnar teas, and order logistics.\n\nI am unable to answer questions outside of our plantation catalog and store services, but I would be delighted to help you discover authentic single-origin spices, recommend an evening tea, or assist with your orders. How may I assist your culinary journey today?`,
      recommendedProducts: [],
      isAiFallback: false,
      suggestedFollowUps: [
        'Recommend an evening tea',
        'Accepted payment options',
        'Find spices for biryani',
        'Show products under ₹500'
      ]
    };
  }

  // --- 2. RETRIEVAL-AUGMENTED GENERATION (RAG) WITH GEMINI ---
  if (GEMINI_API_KEY && GEMINI_API_KEY.trim().length > 10) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

      const systemPrompt = `You are "Spice Roots Assistant", an authoritative culinary advisor and sommelier for Spice Roots, Kerala.
You must ground ALL responses strictly and accurately on this live product catalog:
${JSON.stringify(catalogSummary)}

STORE RULES & POLICIES:
- Accepted Payment Options:
  1. Cash on Delivery (COD)
  2. Pay with Razorpay (UPI, GPay, PhonePe, NetBanking, Wallets)
  3. Pay with Cards (Visa, MasterCard, RuPay, Amex)
- When answering payment inquiries, list ONLY these three accepted options and do NOT recommend products unless explicitly asked.
- Tea Guidance:
  * "Evening Tea" / "Relaxing Tea" -> Strictly recommend "Kolukkumalai High-Peak Orthodox Black Tea" (prod_kolukkumalai_tea) and "Munnar White Tea Silver Tips" (prod_white_tea_tips). DO NOT recommend morning CTC tea or spices.
  * "Morning Tea" / "Chai" -> Strictly recommend "Thalayar Estate Rich CTC Leaf Tea" (prod_thalayar_tea).
- Free Shipping threshold: ₹${(settings.freeShippingThresholdPaise / 100).toFixed(0)}. Standard delivery: ₹${(settings.standardShippingFeePaise / 100).toFixed(0)}.
- Never invent unlisted products or pricing. Use exact pack sizes and prices.
- If you recommend products from the catalog, specify their exact product IDs at the very end in this format:
[[RECOMMENDATIONS: ["prod_id1", "prod_id2"]]]`;

      const promptWithHistory = `${systemPrompt}\n\nCustomer: ${userQuery}`;
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

      if (recommendedIds.length === 0) {
        recommendedIds = findMatchingProductIds(userQuery, products);
      }

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
      console.warn('⚠️ [Gemini AI] Falling back to structured RAG catalog engine:', (err as Error).message);
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

  // Special case: Evening tea
  if (q.includes('evening') && (q.includes('tea') || q.includes('recommend') || q.includes('brew'))) {
    return ['prod_kolukkumalai_tea', 'prod_white_tea_tips'];
  }

  const matched = products.filter(p => {
    const inName = p.name.toLowerCase().includes(q);
    const inDesc = p.shortDescription.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    const inIngr = p.ingredients?.some(i => i.toLowerCase().includes(q));
    const inTags = p.tags?.some(t => t.toLowerCase().includes(q));
    return inName || inDesc || inIngr || inTags;
  });
  return matched.map(m => m.id || '');
}

function buildStructuredCatalogResponse(query: string, products: IProduct[], settings: any): AssistantResponse {
  const q = query.toLowerCase().trim();
  let text = '';
  let matchedIds: string[] = [];
  let followUps: string[] = [];

  // 1. SPECIFIC EVENING TEA INTENT
  if (q.includes('evening') && (q.includes('tea') || q.includes('brew') || q.includes('chai') || q.includes('recommend') || q.includes('drink'))) {
    text = `For a serene evening tea ritual, we specifically recommend our single-estate, high-elevation Munnar teas:\n\n1. 🌿 **Kolukkumalai High-Peak Orthodox Black Tea**: Harvested at 7,900 ft from the highest tea estate on earth. Slowly crafted using traditional 1930s orthodox rolling methods, its crystal-clear golden amber liquor delivers soothing, delicate notes of mountain honey and muscatel—gentle on the palate and perfect for relaxing without heavy astringency.\n\n2. 🌸 **Munnar White Tea Silver Tips**: Hand-plucked at dawn during spring flush from unopened buds with zero oxidation. Filled with natural polyphenols, this rare luxury brew has a silky floral finish with sweet nectar undertones.`;
    matchedIds = ['prod_kolukkumalai_tea', 'prod_white_tea_tips'];
    followUps = [
      'How do I brew orthodox whole leaf tea?',
      'Accepted payment options',
      'What are your shipping charges?'
    ];
  }
  // 2. MORNING TEA / KADAK CHAI INTENT
  else if (q.includes('morning') && (q.includes('tea') || q.includes('chai')) || q.includes('kadak') || q.includes('milk tea')) {
    text = `For an invigorating morning or brisk afternoon cup, **Thalayar Estate Rich CTC Leaf Tea** is our premier selection. Blended with orthodox leaves, it produces a rich copper liquor that pairs magnificently with warm milk, crushed ginger, and cardamom for authentic Kerala roadside chai.`;
    matchedIds = ['prod_thalayar_tea', 'prod_green_cardamom_8mm', 'prod_clove_wayanad'];
    followUps = ['Recommend an evening tea', 'Show spices for chai masala', 'Accepted payment options'];
  }
  // 3. GENERAL TEA QUERY
  else if (q.includes('tea') || q.includes('chai')) {
    text = `Spice Roots curates three authentic single-estate teas from the mist-covered peaks of Munnar:\n\n• **Kolukkumalai High-Peak Orthodox Black Tea** (7,900 ft) — Soothing evening whole leaf with muscatel notes.\n• **Munnar White Tea Silver Tips** — Pure velvet buds, delicate and antioxidant-rich.\n• **Thalayar Estate Rich CTC Leaf Tea** — Bold, robust morning blend for kadak milk chai.`;
    matchedIds = ['prod_kolukkumalai_tea', 'prod_white_tea_tips', 'prod_thalayar_tea'];
    followUps = ['Recommend an evening tea', 'What is the elevation of Kolukkumalai?', 'Accepted payment options'];
  }
  // 4. BIRYANI / GARAM MASALA INTENT
  else if (q.includes('biryani') || q.includes('pulao') || q.includes('chicken') || q.includes('mutton') || q.includes('curry')) {
    text = `For authentic Malabar Dum Biryani, our signature stone-ground **Royal Malabar Garam Masala** paired with whole **Alleppey 8mm Green Cardamom** and aromatic **Selected 8-Pointed Star Anise** provides deep floral warmth and regal fragrance without needing artificial essences.`;
    matchedIds = ['prod_kerala_garam_masala', 'prod_green_cardamom_8mm', 'prod_star_anise'];
    followUps = ['How much garam masala should I use?', 'Do you have Ceylon cinnamon?', 'Accepted payment options'];
  }
  // 5. PEPPER INTENT
  else if (q.includes('pepper') || q.includes('tellicherry') || q.includes('black pepper')) {
    text = `Our **Malabar Tellicherry Black Pepper (Garbled)** is hand-sorted in Idukki to ensure bold 4.5mm berries. Rich in piperine and natural essential oils, it delivers a crisp citrus burst followed by deep, clean mountain heat. Available in 100g (₹160), 250g (₹380), and 500g (₹720).`;
    matchedIds = ['prod_black_pepper'];
    followUps = ['What sizes are available?', 'Show green cardamom', 'Accepted payment options'];
  }
  // 6. CARDAMOM INTENT
  else if (q.includes('cardamom') || q.includes('elaichi')) {
    text = `Our **Alleppey Green Cardamom — 8mm Super Bold** represents the top 5% of the Kerala harvest. Each pod is intensely green, packed with oily jet-black seeds, and offers extraordinary aromatic sweetness. Available in 50g (₹290), 100g (₹550), and 250g (₹1,320).`;
    matchedIds = ['prod_green_cardamom_8mm'];
    followUps = ['Recommend tea to pair with cardamom', 'Show garam masala', 'Accepted payment options'];
  }
  // 7. GIFT BOX / HAMPER INTENT
  else if (q.includes('gift') || q.includes('box') || q.includes('hamper') || q.includes('present') || q.includes('casket')) {
    text = `The **Western Ghats Spice Discovery Wooden Casket** is our heirloom gift piece. Crafted from seasoned wood with brass latch fittings, it houses 6 royal Kerala spices in reusable glass canisters—ideal for festive and corporate gifting.`;
    matchedIds = ['prod_heritage_spice_box', 'prod_roasted_almond_chocolate'];
    followUps = ['Can I ship to multiple addresses?', 'What payment options do you support?', 'View all gift boxes'];
  }
  // 8. BUDGET / UNDER ₹500
  else if (q.includes('500') || q.includes('budget') || q.includes('cheap') || q.includes('under')) {
    text = `Here are our finest plantation-fresh harvests available under ₹500:\n\n• **Malabar Tellicherry Black Pepper 100g** — ₹160\n• **Thalayar Estate Rich CTC Leaf Tea 250g** — ₹140\n• **High-Eugenol Wayanad Clove Buds 100g** — ₹220\n• **Kerala Pathimugam (Sappan Wood) 100g** — ₹120`;
    matchedIds = ['prod_black_pepper', 'prod_thalayar_tea', 'prod_clove_wayanad', 'prod_pathimugam'];
    followUps = ['Recommend an evening tea', 'How do I qualify for free shipping?', 'Accepted payment options'];
  }
  // 9. STORAGE & SHELF LIFE
  else if (q.includes('store') || q.includes('shelf') || q.includes('keep') || q.includes('expire')) {
    text = `🌿 **Spice Storage Golden Rules from Kerala Planters:**\n\n1. Store in airtight amber glass jars away from direct sun and heat.\n2. Never shake spice jars over boiling pots (steam introduces moisture and ruins essential oils).\n3. Whole spices retain peak potency for 12–18 months; ground masalas are best enjoyed within 6 months.`;
    matchedIds = ['prod_black_pepper', 'prod_green_cardamom_8mm'];
    followUps = ['Which whole spices do you sell?', 'Accepted payment options'];
  }
  // 10. SHIPPING & LOGISTICS
  else if (q.includes('shipping') || q.includes('delivery') || q.includes('courier') || q.includes('track')) {
    const freeThresh = (settings.freeShippingThresholdPaise / 100).toFixed(0);
    const fee = (settings.standardShippingFeePaise / 100).toFixed(0);
    text = `📦 **Shipping & Delivery:**\n• transparency shipping across india  ₹${freeThresh} (standard fee ₹${fee}).\n• Parcels are dispatched within 24-48 business hours from our Munnar depot via Blue Dart Express & DTDC.\n• Estimated pan-India delivery time: 3 to 6 business days.`;
    matchedIds = ['prod_black_pepper', 'prod_kolukkumalai_tea'];
    followUps = ['Accepted payment options', 'Recommend an evening tea', 'Track my order'];
  }
  // 11. DEFAULT WELCOME / DISCOVERY
  else {
    text = `Welcome to Spice Roots! Sourced directly from our family estates across Munnar, Idukki, and Wayanad, I can recommend single-origin spices, rare high-mountain teas, or clarify our payment and shipping terms.`;
    matchedIds = ['prod_kolukkumalai_tea', 'prod_black_pepper', 'prod_green_cardamom_8mm'];
    followUps = [
      'Recommend an evening tea',
      'Accepted payment options',
      'Find spices for biryani',
      'Show products under ₹500'
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
