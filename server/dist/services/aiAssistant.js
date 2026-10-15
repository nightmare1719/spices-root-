import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../models/dataStore.js';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export async function processAssistantChat(userQuery, history = []) {
    const products = db.getProducts().filter(p => p.isPublished);
    const settings = db.getSettings();
    // If Gemini API Key is present, attempt generative answer
    if (GEMINI_API_KEY && GEMINI_API_KEY.trim().length > 10) {
        try {
            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            // Compact catalog summary for grounding
            const catalogSummary = products.map(p => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                category: p.category,
                variants: p.variants.map(v => `${v.packSize}: ₹${(v.pricePaise / 100).toFixed(0)}`),
                description: p.shortDescription,
                ingredients: p.ingredients?.join(', ')
            }));
            const systemPrompt = `You are "Spice Roots Assistant", a warm, knowledgeable culinary advisor for Spice Roots, a luxury spice brand sourcing authentic spices and teas from Kerala and the Western Ghats.
Ground all product answers strictly on this live catalog:
${JSON.stringify(catalogSummary)}

Store Policies & Context:
- Free shipping on orders above ₹${(settings.freeShippingThresholdPaise / 100).toFixed(0)}. Standard delivery ₹${(settings.standardShippingFeePaise / 100).toFixed(0)}.
- Dispatch within 24-48 business hours from Munnar, Kerala. Delivery within 3-6 days across India.
- Never fabricate products or prices. Use only exact prices and pack sizes listed.
- At the end of your response, if you recommend products from the catalog, specify their exact product IDs in this JSON block format:
[[RECOMMENDATIONS: ["id1", "id2"]]]`;
            const promptWithHistory = `${systemPrompt}\n\nCustomer: ${userQuery}`;
            const result = await model.generateContent(promptWithHistory);
            const rawText = result.response.text();
            // Extract recommended product IDs
            const match = rawText.match(/\[\[RECOMMENDATIONS:\s*(\[.*?\])\s*\]\]/);
            let recommendedIds = [];
            let cleanMessage = rawText;
            if (match && match[1]) {
                try {
                    recommendedIds = JSON.parse(match[1]);
                    cleanMessage = rawText.replace(match[0], '').trim();
                }
                catch {
                    // fallback
                }
            }
            // If no IDs were extracted via regex, do keyword matching on the catalog
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
        }
        catch (err) {
            console.warn('⚠️ [Gemini AI] Error or rate limit, falling back to smart catalog engine:', err.message);
        }
    }
    // --- SMART CATALOG ENGINE (Zero API key dependency fallback) ---
    return buildSmartCatalogResponse(userQuery, products, settings);
}
function generateFollowUps(query) {
    const q = query.toLowerCase();
    if (q.includes('biryani')) {
        return ['What size garam masala is best?', 'Do you have whole star anise?', 'Check free shipping policy'];
    }
    if (q.includes('tea')) {
        return ['What is the elevation of Kolukkumalai?', 'How to brew whole leaf tea?', 'Show green tea options'];
    }
    return ['Tell me about Malabar pepper', 'What are your bestsellers?', 'Show products under ₹500'];
}
function findMatchingProductIds(query, products) {
    const q = query.toLowerCase();
    const matched = products.filter(p => {
        const inName = p.name.toLowerCase().includes(q);
        const inDesc = p.shortDescription.toLowerCase().includes(q);
        const inIngr = p.ingredients?.some(i => i.toLowerCase().includes(q));
        const inTags = p.tags?.some(t => t.toLowerCase().includes(q));
        return inName || inDesc || inIngr || inTags;
    });
    return matched.map(m => m.id || '');
}
function buildSmartCatalogResponse(query, products, settings) {
    const q = query.toLowerCase();
    let text = '';
    let matchedIds = [];
    let followUps = [
        'Which pepper should I buy?',
        'Find spices for biryani',
        'Recommend an evening tea',
        'Show gift boxes under ₹2000'
    ];
    if (q.includes('biryani') || q.includes('pulao') || q.includes('chicken') || q.includes('mutton')) {
        text = `For an unforgettable, restaurant-grade Biryani, our signature Royal Malabar Garam Masala combined with hand-picked 8mm Alleppey Green Cardamom and Star Anise provides unmatched fragrance without needing harsh artificial flavorings.`;
        matchedIds = ['prod_kerala_garam_masala', 'prod_green_cardamom_8mm', 'prod_star_anise'];
        followUps = ['How do I use this garam masala?', 'Do you have Ceylon cinnamon?', 'What are the shipping charges?'];
    }
    else if (q.includes('pepper') || q.includes('tellicherry') || q.includes('black pepper')) {
        text = `Our Malabar Tellicherry Black Pepper is harvested at peak maturity in Idukki and sun-cured naturally. With a bold 4.5mm berry size, it offers a crisp citrusy aroma followed by warm, lingering heat.`;
        matchedIds = ['prod_black_pepper'];
        followUps = ['What sizes are available?', 'Show me green cardamom', 'Tell me about storage'];
    }
    else if (q.includes('tea') || q.includes('chai') || q.includes('evening') || q.includes('sleep') || q.includes('relax')) {
        text = `For evening relaxation or mindful sipping, our high-altitude Kolukkumalai Orthodox Black Tea (7,900 ft) offers delicate muscatel notes. If you prefer a rare, gentle antioxidant brew, try the Munnar White Tea Silver Tips. For strong milk tea lovers, Thalayar Estate CTC is exceptional.`;
        matchedIds = ['prod_kolukkumalai_tea', 'prod_white_tea_tips', 'prod_thalayar_tea'];
        followUps = ['How to brew orthodox tea?', 'Do you have green tea?', 'Are your teas organic?'];
    }
    else if (q.includes('gift') || q.includes('box') || q.includes('hamper') || q.includes('present')) {
        text = `Our Western Ghats Spice Discovery Wooden Casket is our crowning gift set. Handcrafted from seasoned wood with brass accents, it features 6 royal whole spices in reusable glass canisters.`;
        matchedIds = ['prod_heritage_spice_box', 'prod_roasted_almond_chocolate'];
        followUps = ['Can I ship to another address?', 'Is corporate gifting available?', 'Do you provide gift packaging?'];
    }
    else if (q.includes('500') || q.includes('cheap') || q.includes('under') || q.includes('budget')) {
        text = `Here are some of our most loved plantation-fresh selections available under ₹500, including authentic Malabar pepper, Wayanad clove buds, and traditional Kerala Pathimugam:`;
        matchedIds = ['prod_black_pepper', 'prod_clove_wayanad', 'prod_pathimugam'];
        followUps = ['Show all products under ₹1000', 'How do I get free shipping?', 'Add to cart'];
    }
    else if (q.includes('store') || q.includes('shelf') || q.includes('keep') || q.includes('spoil')) {
        text = `🌿 **Spice Storage Golden Rules:**
1. Store whole spices in airtight glass or ceramic jars away from heat, steam, and direct sun.
2. Avoid shaking spice jars over a steaming pot, as moisture causes caking and mold.
3. Whole spices retain full potency for 12–18 months, whereas pre-ground spices are best enjoyed within 4–6 months.`;
        matchedIds = ['prod_black_pepper', 'prod_green_cardamom_8mm'];
        followUps = ['Which whole spices do you sell?', 'Recommend spices for curry'];
    }
    else if (q.includes('shipping') || q.includes('delivery') || q.includes('courier')) {
        text = `📦 We ship nationwide across India! Orders above ₹${(settings.freeShippingThresholdPaise / 100).toFixed(0)} qualify for **Free Shipping**. Standard delivery is ₹${(settings.standardShippingFeePaise / 100).toFixed(0)}. Orders are dispatched directly from our Munnar depot within 24-48 business hours.`;
        matchedIds = ['prod_black_pepper', 'prod_kolukkumalai_tea'];
        followUps = ['Track my order', 'What payment methods do you accept?'];
    }
    else {
        text = `Welcome to Spice Roots! I'm here to help you discover authentic single-origin spices and high-mountain teas from Kerala. Here are three of our most celebrated harvest highlights:`;
        matchedIds = ['prod_black_pepper', 'prod_green_cardamom_8mm', 'prod_kolukkumalai_tea'];
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
