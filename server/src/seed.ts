import bcrypt from 'bcryptjs';
import { db } from './models/dataStore.js';
import { ICategory, IProduct, ICoupon } from './types/index.js';

export async function runSeed(force: boolean = false) {
  db.init();

  const existingProducts = db.getProducts();
  if (existingProducts.length > 0 && !force) {
    console.log(`ℹ️ [Seed] Database already contains ${existingProducts.length} products. Skipping re-seed.`);
    return;
  }

  console.log('🌱 [Seed] Populating Spice Roots authentic catalog and configuration...');

  // 1. Categories
  const categories: ICategory[] = [
    {
      id: 'cat_spices',
      name: 'Whole & Ground Spices',
      slug: 'spices',
      description: 'Hand-picked from the mountain slopes of Idukki and Wayanad, sun-dried to preserve pure volatile oils.',
      image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
      isActive: true
    },
    {
      id: 'cat_masalas',
      name: 'Artisan Masala Blends',
      slug: 'masalas',
      description: 'Slow-roasted traditional Kerala spices blended in small batches without fillers or artificial colors.',
      image: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=800&q=80',
      isActive: true
    },
    {
      id: 'cat_tea',
      name: 'Munnar & High-Grown Tea',
      slug: 'tea',
      description: 'Single-estate orthodox whole leaf, silver tips, and aromatic CTC teas from Kolukkumalai & Thalayar.',
      image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
      isActive: true
    },
    {
      id: 'cat_oils',
      name: 'Essential Oils & Naturals',
      slug: 'essential_oils',
      description: 'Steam-distilled pure lemongrass, rosemary, eucalyptus, and virgin cold-pressed coconut oil.',
      image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80',
      isActive: true
    },
    {
      id: 'cat_gift',
      name: 'Gift Boxes & Hampers',
      slug: 'gift_boxes',
      description: 'Curated wooden spice caskets and celebration hampers packed with the finest Western Ghats harvest.',
      image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
      isActive: true
    },
    {
      id: 'cat_chocolates',
      name: 'Munnar Artisan Chocolates',
      slug: 'chocolates',
      description: 'Handcrafted rich cocoa chocolates infused with roasted plantation nuts and subtle spice notes.',
      image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80',
      isActive: true
    }
  ];

  db.setCategories(categories);

  // 2. Products
  const products: IProduct[] = [
    {
      id: 'prod_black_pepper',
      name: 'Malabar Tellicherry Black Pepper (Garbled)',
      slug: 'malabar-black-pepper',
      category: 'spices',
      shortDescription: 'Bold 4.5mm sun-dried black peppercorns from Idukki, renowned for sharp heat and citrus-woody undertones.',
      description: 'Grown in high-altitude shade plantations in Kerala, our Malabar black pepper is harvested at optimal maturity and sun-cured naturally on bamboo mats. Rich in natural piperine, it delivers an instant floral burst followed by a sustained, complex peppery heat.',
      origin: 'Idukki & Wayanad, Kerala',
      ingredients: ['100% Pure Garbled Whole Black Peppercorns (Piper nigrum)'],
      storageInfo: 'Store in an airtight ceramic or glass jar in a cool, dark cupboard away from direct sunlight and humidity.',
      usageTips: 'Crack coarsely right before serving over creamy gravies, roasted meats, pasta, or traditional rasam.',
      images: [
        'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=1000&q=80'
      ],
      isFeatured: true,
      isPublished: true,
      variants: [
        { id: 'v_bp_100', sku: 'SR-BP-100G', packSize: '100 g', unit: 'g', pricePaise: 16000, comparePricePaise: 19000, stock: 120, isAvailable: true },
        { id: 'v_bp_250', sku: 'SR-BP-250G', packSize: '250 g', unit: 'g', pricePaise: 38000, comparePricePaise: 44000, stock: 85, isAvailable: true },
        { id: 'v_bp_500', sku: 'SR-BP-500G', packSize: '500 g', unit: 'g', pricePaise: 72000, comparePricePaise: 85000, stock: 45, isAvailable: true },
        { id: 'v_bp_1000', sku: 'SR-BP-1KG', packSize: '1 kg', unit: 'kg', pricePaise: 135000, comparePricePaise: 160000, stock: 30, isAvailable: true }
      ],
      rating: 4.9,
      reviewCount: 38,
      tags: ['pepper', 'whole spices', 'bestseller', 'kerala'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod_green_cardamom_8mm',
      name: 'Alleppey Green Cardamom — 8mm Super Bold',
      slug: 'alleppey-green-cardamom-8mm',
      category: 'spices',
      shortDescription: 'Extra-large 8mm emerald-green cardamom pods bursting with intense menthol-sweet aromatic oils.',
      description: 'Known worldwide as the Queen of Spices, our Alleppey Green Cardamom is carefully hand-graded to select only the plumpest 8mm pods. Sourced directly from mist-covered valleys near Munnar, each pod retains its vibrant emerald shade and sweet camphoraceous aroma.',
      origin: 'Vandanmedu & Munnar, Kerala',
      ingredients: ['100% Whole Alleppey Green Cardamom Pods (Elettaria cardamomum)'],
      storageInfo: 'Keep tightly sealed in an opaque container to preserve the volatile cardamom oil.',
      usageTips: 'Lightly crush whole pods into chai, fragrant biryani, kheer, payasam, or baking batters.',
      images: [
        'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1000&q=80'
      ],
      isFeatured: true,
      isPublished: true,
      variants: [
        { id: 'v_gc_50', sku: 'SR-GC-50G', packSize: '50 g', unit: 'g', pricePaise: 27500, comparePricePaise: 32000, stock: 95, isAvailable: true },
        { id: 'v_gc_100', sku: 'SR-GC-100G', packSize: '100 g', unit: 'g', pricePaise: 52000, comparePricePaise: 60000, stock: 70, isAvailable: true },
        { id: 'v_gc_250', sku: 'SR-GC-250G', packSize: '250 g', unit: 'g', pricePaise: 125000, comparePricePaise: 145000, stock: 35, isAvailable: true },
        { id: 'v_gc_500', sku: 'SR-GC-500G', packSize: '500 g', unit: 'g', pricePaise: 240000, comparePricePaise: 280000, stock: 18, isAvailable: true }
      ],
      rating: 5.0,
      reviewCount: 42,
      tags: ['cardamom', 'luxury', 'bestseller', 'whole spices'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod_ceylon_cinnamon',
      name: 'Handcrafted Ceylon Roll Cinnamon Quills',
      slug: 'ceylon-roll-cinnamon',
      category: 'spices',
      shortDescription: 'Delicate multi-layered sweet cinnamon quills with ultra-low coumarin, harvested from coastal ghat forests.',
      description: 'Unlike rough, hard cassia bark, our true Ceylon cinnamon rolls feature papery-thin layers softly curled by experienced estate artisans. It boasts a gentle, delicate woody sweetness without bitterness, making it ideal for both savory curries and gourmet desserts.',
      origin: 'Western Ghats Border Forest Estates',
      ingredients: ['100% Pure Ceylon Cinnamon Bark (Cinnamomum verum)'],
      storageInfo: 'Keep in a cool, moisture-free container.',
      usageTips: 'Simmer whole sticks in aromatic pulao, hot spiced mulled apple cider, or steeped teas.',
      images: [
        'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1000&q=80'
      ],
      isFeatured: true,
      isPublished: true,
      variants: [
        { id: 'v_cin_100', sku: 'SR-CIN-100G', packSize: '100 g', unit: 'g', pricePaise: 19000, comparePricePaise: 22000, stock: 80, isAvailable: true },
        { id: 'v_cin_250', sku: 'SR-CIN-250G', packSize: '250 g', unit: 'g', pricePaise: 44000, comparePricePaise: 50000, stock: 40, isAvailable: true },
        { id: 'v_cin_500', sku: 'SR-CIN-500G', packSize: '500 g', unit: 'g', pricePaise: 82000, comparePricePaise: 95000, stock: 25, isAvailable: true }
      ],
      rating: 4.8,
      reviewCount: 29,
      tags: ['cinnamon', 'baking', 'sweet spices'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod_clove_wayanad',
      name: 'High-Eugenol Wayanad Clove Buds',
      slug: 'wayanad-clove-buds',
      category: 'spices',
      shortDescription: 'Plump reddish-brown clove buds hand-picked before flowering, overflowing with natural eugenol oil.',
      description: 'Sourced from organic family groves in the heights of Wayanad, our clove buds are dried with their crown crowns intact. When pressed gently, they release a deep, warm aromatic oil that lends immense depth to Kerala curries, biryanis, and herbal concoctions.',
      origin: 'Wayanad, Kerala',
      ingredients: ['100% Hand-picked Whole Cloves (Syzygium aromaticum)'],
      storageInfo: 'Store in airtight tins or dark glass containers.',
      usageTips: 'Stud into onions for stocks, or infuse into chai, garam masala, and slow-braised curries.',
      images: [
        'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=1000&q=80'
      ],
      isFeatured: false,
      isPublished: true,
      variants: [
        { id: 'v_clv_50', sku: 'SR-CLV-50G', packSize: '50 g', unit: 'g', pricePaise: 14000, comparePricePaise: 16500, stock: 65, isAvailable: true },
        { id: 'v_clv_100', sku: 'SR-CLV-100G', packSize: '100 g', unit: 'g', pricePaise: 26000, comparePricePaise: 30000, stock: 50, isAvailable: true },
        { id: 'v_clv_250', sku: 'SR-CLV-250G', packSize: '250 g', unit: 'g', pricePaise: 62000, comparePricePaise: 70000, stock: 30, isAvailable: true }
      ],
      rating: 4.9,
      reviewCount: 21,
      tags: ['clove', 'whole spices'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod_star_anise',
      name: 'Selected 8-Pointed Star Anise',
      slug: 'whole-star-anise',
      category: 'spices',
      shortDescription: 'Intact sun-dried star anise blooms bearing sweet licorice fragrance and high anethole oil.',
      description: 'Carefully sorted so every star remains intact, our star anise blooms bring an intoxicating licorice sweetness and glossy aromatic note essential for biryani, pho, and slow-simmered Asian stews.',
      origin: 'Western Ghats Sub-Tropical Slopes',
      ingredients: ['100% Whole Star Anise Pods (Illicium verum)'],
      storageInfo: 'Keep in an airtight jar in a dry pantry.',
      usageTips: 'Toss a single star into rice boiling water or hot cooking oil during tadka.',
      images: [
        'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=1000&q=80'
      ],
      isFeatured: false,
      isPublished: true,
      variants: [
        { id: 'v_sta_100', sku: 'SR-STA-100G', packSize: '100 g', unit: 'g', pricePaise: 22000, comparePricePaise: 26000, stock: 50, isAvailable: true },
        { id: 'v_sta_250', sku: 'SR-STA-250G', packSize: '250 g', unit: 'g', pricePaise: 50000, comparePricePaise: 58000, stock: 30, isAvailable: true }
      ],
      rating: 4.8,
      reviewCount: 16,
      tags: ['star anise', 'biryani'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod_mace_nutmeg',
      name: 'Kerala Red Nut Mace (Javitri) & Nutmeg Combo',
      slug: 'kerala-nut-mace-nutmeg',
      category: 'spices',
      shortDescription: 'Brilliant carmine-red lace mace arils with whole shelled nutmeg fruit.',
      description: 'Directly sourced from organic nutmeg gardens in Kalady and Munnar foothills. Mace is the delicate lace-like lattice surrounding the nutmeg seed, possessing a much more floral, refined and musky warmth than nutmeg alone.',
      origin: 'Periyar River Basin, Kerala',
      ingredients: ['Whole Natural Nut Mace (Myristica fragrans aril)'],
      storageInfo: 'Keep tightly sealed away from air and humidity.',
      usageTips: 'Grind freshly into Mughlai gravies, Dum Biryani, or gourmet béchamel and custards.',
      images: [
        'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1000&q=80'
      ],
      isFeatured: false,
      isPublished: true,
      variants: [
        { id: 'v_mac_50', sku: 'SR-MAC-50G', packSize: '50 g', unit: 'g', pricePaise: 28000, comparePricePaise: 32000, stock: 40, isAvailable: true },
        { id: 'v_mac_100', sku: 'SR-MAC-100G', packSize: '100 g', unit: 'g', pricePaise: 54000, comparePricePaise: 62000, stock: 25, isAvailable: true }
      ],
      rating: 4.9,
      reviewCount: 18,
      tags: ['mace', 'javitri', 'nutmeg', 'rare'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod_pathimugam',
      name: 'Authentic Kerala Pathimugam (Sappan Wood)',
      slug: 'kerala-pathimugam-sappan-wood',
      category: 'spices',
      shortDescription: 'Traditional Kerala Ayurvedic pink herbal drinking water wood shaving, cooling and detoxifying.',
      description: 'Pathimugam (Caesalpinia sappan) is an iconic Kerala tradition. Boiling water infused with these natural wood shavings turns into an elegant rose-pink herbal elixir known for blood purification, digestion ease, and body-cooling properties.',
      origin: 'Idukki Forest Edge Cooperatives, Kerala',
      ingredients: ['100% Pure Dried Sappan Wood Shavings (Caesalpinia sappan)'],
      storageInfo: 'Store in a dry cloth pouch or airtight jar.',
      usageTips: 'Boil 1 liter of drinking water with 1/2 teaspoon of Pathimugam shavings for 2-3 minutes. Drink warm or chilled throughout the day.',
      images: [
        'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=1000&q=80'
      ],
      isFeatured: true,
      isPublished: true,
      variants: [
        { id: 'v_pat_100', sku: 'SR-PAT-100G', packSize: '100 g', unit: 'g', pricePaise: 12000, comparePricePaise: 15000, stock: 150, isAvailable: true },
        { id: 'v_pat_250', sku: 'SR-PAT-250G', packSize: '250 g', unit: 'g', pricePaise: 27000, comparePricePaise: 33000, stock: 90, isAvailable: true }
      ],
      rating: 4.9,
      reviewCount: 35,
      tags: ['ayurvedic', 'traditional', 'kerala herbal'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod_kerala_garam_masala',
      name: 'Royal Malabar Garam Masala (Stone-Ground)',
      slug: 'royal-malabar-garam-masala',
      category: 'masalas',
      shortDescription: 'Hand-roasted blend of 12 hill spices including green cardamom, mace, cinnamon, star anise, and fennel.',
      description: 'Crafted following an authentic century-old Malabar heritage recipe. We slow-roast each spice separately at controlled temperatures to coax out aromatic essential oils before coarse stone-grinding. Contains zero coriander, zero chilli powder fillers, and zero preservatives.',
      origin: 'Malabar & Munnar, Kerala',
      ingredients: ['Green Cardamom', 'Cloves', 'Ceylon Cinnamon', 'Nut Mace', 'Star Anise', 'Fennel', 'Black Pepper', 'Nutmeg', 'Bay Leaves', 'Stone Flower (Kalpasi)'],
      storageInfo: 'Seal tightly after each use to keep essential aromas locked in.',
      usageTips: 'Add 1/2 teaspoon towards the final 5 minutes of cooking your curry, biryani, or stew.',
      images: [
        'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=1000&q=80'
      ],
      isFeatured: true,
      isPublished: true,
      variants: [
        { id: 'v_gm_100', sku: 'SR-GM-100G', packSize: '100 g', unit: 'g', pricePaise: 21000, comparePricePaise: 25000, stock: 110, isAvailable: true },
        { id: 'v_gm_250', sku: 'SR-GM-250G', packSize: '250 g', unit: 'g', pricePaise: 49000, comparePricePaise: 58000, stock: 65, isAvailable: true }
      ],
      rating: 5.0,
      reviewCount: 47,
      tags: ['masala', 'bestseller', 'biryani'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod_kolukkumalai_tea',
      name: 'Kolukkumalai High-Peak Orthodox Black Tea',
      slug: 'kolukkumalai-orthodox-tea',
      category: 'tea',
      shortDescription: 'Single-estate orthodox whole leaf tea harvested from the highest organic tea gardens in the world (7,900 ft).',
      description: 'Perched in the sky above Munnar, Kolukkumalai produces tea leaves kissed by mountain clouds and crisp morning frost. Crafted using traditional 1930s orthodox rolling methods, this golden liquor presents notes of honey, mountain pine, and muscatel.',
      origin: 'Kolukkumalai Estate (7,900 ft), Munnar',
      ingredients: ['100% Orthodox High-Grown Pure Black Tea Leaves (Camellia sinensis)'],
      storageInfo: 'Store in an opaque, airtight canister away from pantry spices.',
      usageTips: 'Steep 1 teaspoon in 90°C hot water for 3 to 4 minutes. Enjoy pristine without milk, or with a dash of honey and lemon.',
      images: [
        'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=1000&q=80'
      ],
      isFeatured: true,
      isPublished: true,
      variants: [
        { id: 'v_kt_100', sku: 'SR-KT-100G', packSize: '100 g', unit: 'g', pricePaise: 24000, comparePricePaise: 28000, stock: 75, isAvailable: true },
        { id: 'v_kt_250', sku: 'SR-KT-250G', packSize: '250 g', unit: 'g', pricePaise: 54000, comparePricePaise: 62000, stock: 50, isAvailable: true },
        { id: 'v_kt_500', sku: 'SR-KT-500G', packSize: '500 g', unit: 'g', pricePaise: 98000, comparePricePaise: 115000, stock: 30, isAvailable: true }
      ],
      rating: 4.9,
      reviewCount: 39,
      tags: ['tea', 'kolukkumalai', 'munnar', 'bestseller'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod_thalayar_tea',
      name: 'Thalayar Estate Rich CTC Leaf Tea',
      slug: 'thalayar-estate-ctc-tea',
      category: 'tea',
      shortDescription: 'Robust, full-bodied morning milk tea blend from the sunny valleys of Thalayar Estate, Munnar.',
      description: 'Specially selected CTC leaf blended with orthodox whole leaves for rapid strength, rich golden color, and invigorating briskness. Perfect for the quintessential Indian Masala Chai or Kadak Morning Chai.',
      origin: 'Thalayar Estate, Munnar, Kerala',
      ingredients: ['100% Pure Plantation-Packed CTC Black Tea'],
      storageInfo: 'Keep in an airtight container.',
      usageTips: 'Boil with water and milk in 1:1 ratio. Add freshly crushed ginger and Spice Roots Cardamom for heavenly chai.',
      images: [
        'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=1000&q=80'
      ],
      isFeatured: false,
      isPublished: true,
      variants: [
        { id: 'v_tt_250', sku: 'SR-TT-250G', packSize: '250 g', unit: 'g', pricePaise: 14000, comparePricePaise: 17000, stock: 120, isAvailable: true },
        { id: 'v_tt_500', sku: 'SR-TT-500G', packSize: '500 g', unit: 'g', pricePaise: 26000, comparePricePaise: 31000, stock: 80, isAvailable: true },
        { id: 'v_tt_1000', sku: 'SR-TT-1KG', packSize: '1 kg', unit: 'kg', pricePaise: 48000, comparePricePaise: 56000, stock: 45, isAvailable: true }
      ],
      rating: 4.8,
      reviewCount: 31,
      tags: ['tea', 'chai', 'ctc'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod_white_tea_tips',
      name: 'Munnar White Tea Silver Tips',
      slug: 'munnar-white-tea-silver-tips',
      category: 'tea',
      shortDescription: 'Extremely rare unopened velvety tea buds sun-cured with zero oxidation, offering sweet floral undertones.',
      description: 'Hand-plucked only at dawn during spring flushes, Silver Tips represent the peak luxury of tea cultivation. Packed with natural polyphenols, this rare brew delivers a crystal-pale liquor with delicate notes of jasmine and wild honey.',
      origin: 'High Elevation Munnar Gardens',
      ingredients: ['100% Unopened Velvety Tea Buds (Camellia sinensis)'],
      storageInfo: 'Keep in an airtight ceramic jar away from spices.',
      usageTips: 'Infuse 1-2 grams in 75-80°C hot water for 4 minutes. Leaves can be re-steeped up to 3 times.',
      images: [
        'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1000&q=80'
      ],
      isFeatured: true,
      isPublished: true,
      variants: [
        { id: 'v_wt_25', sku: 'SR-WT-25G', packSize: '25 g', unit: 'g', pricePaise: 65000, comparePricePaise: 75000, stock: 35, isAvailable: true },
        { id: 'v_wt_50', sku: 'SR-WT-50G', packSize: '50 g', unit: 'g', pricePaise: 110000, comparePricePaise: 125000, stock: 20, isAvailable: true }
      ],
      rating: 5.0,
      reviewCount: 14,
      tags: ['white tea', 'luxury', 'rare'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod_lemongrass_oil',
      name: 'Kundaly Naturals Steam-Distilled Lemongrass Oil',
      slug: 'kundaly-lemongrass-oil',
      category: 'essential_oils',
      shortDescription: '100% pure steam-distilled essential oil from wild Munnar hill lemongrass, invigorating and purifying.',
      description: 'Harvested from steep hillside terraces in Kundaly Valley, Munnar, this pure essential oil carries intense citral fragrance. Widely prized for natural aromatherapy, diffusers, home purification, and stress relief.',
      origin: 'Kundaly Valley, Munnar, Kerala',
      ingredients: ['100% Pure Steam-Distilled Lemongrass Essential Oil (Cymbopogon flexuosus)'],
      storageInfo: 'Store in amber glass dropper bottle in a cool place away from open flame.',
      usageTips: 'Add 4-5 drops into an aroma diffuser or warm bath. Dilute with carrier oil before topical use.',
      images: [
        'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1000&q=80'
      ],
      isFeatured: false,
      isPublished: true,
      variants: [
        { id: 'v_lgo_30', sku: 'SR-LGO-30ML', packSize: '30 ml', unit: 'ml', pricePaise: 22000, comparePricePaise: 26000, stock: 60, isAvailable: true },
        { id: 'v_lgo_100', sku: 'SR-LGO-100ML', packSize: '100 ml', unit: 'ml', pricePaise: 45500, comparePricePaise: 52000, stock: 45, isAvailable: true }
      ],
      rating: 4.8,
      reviewCount: 22,
      tags: ['essential oil', 'lemongrass', 'aromatherapy'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod_coconut_oil_cold_pressed',
      name: 'Heritage Cold-Pressed Virgin Coconut Oil',
      slug: 'virgin-cold-pressed-coconut-oil',
      category: 'essential_oils',
      shortDescription: 'Extracted from fresh Kerala coconuts on traditional wooden chekku (wood press) with zero chemical heating.',
      description: 'Clear, fragrant, and pure as rainwater. Extracted mechanically from mature sun-dried copra, keeping all vital lauric acid, natural vitamins, and comforting nutty aroma intact.',
      origin: 'Coastal Kerala Plantations',
      ingredients: ['100% Cold-Pressed Pure Coconut Oil (Cocos nucifera)'],
      storageInfo: 'Solidifies naturally below 24°C without any change in quality.',
      usageTips: 'Authentic medium for Kerala seafood and vegetable curries, or nourishing head and body massage.',
      images: [
        'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1000&q=80'
      ],
      isFeatured: false,
      isPublished: true,
      variants: [
        { id: 'v_co_500', sku: 'SR-CO-500ML', packSize: '500 ml', unit: 'ml', pricePaise: 22000, comparePricePaise: 26000, stock: 80, isAvailable: true },
        { id: 'v_co_1000', sku: 'SR-CO-1LTR', packSize: '1 L', unit: 'L', pricePaise: 38000, comparePricePaise: 45000, stock: 55, isAvailable: true }
      ],
      rating: 4.9,
      reviewCount: 26,
      tags: ['coconut oil', 'pure', 'cold-pressed'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod_heritage_spice_box',
      name: 'Western Ghats Spice Discovery Wooden Casket',
      slug: 'western-ghats-spice-discovery-casket',
      category: 'gift_boxes',
      shortDescription: 'Handcrafted seasoned rosewood chest filled with 6 royal spice jars: Cardamom, Pepper, Clove, Cinnamon, Star Anise & Nutmeg.',
      description: 'The ultimate culinary gift for passionate home chefs and spice connoisseurs. Each velvet-lined artisan chest houses six reusable brass-capped glass containers packed with our premier export-grade harvests.',
      origin: 'Handcrafted in Munnar & Idukki, Kerala',
      ingredients: ['Alleppey Green Cardamom 8mm', 'Tellicherry Black Pepper', 'Ceylon Cinnamon Quills', 'Wayanad Cloves', 'Whole Star Anise', 'Nut Mace'],
      storageInfo: 'Keep wooden box closed in a cool, moisture-safe room.',
      usageTips: 'A magnificent centerpiece for festive gifting, corporate appreciation, and weddings.',
      images: [
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1000&q=80'
      ],
      isFeatured: true,
      isPublished: true,
      variants: [
        { id: 'v_box_6', sku: 'SR-GIFT-6SPICE', packSize: '6-Spice Casket (350g net)', unit: 'box', pricePaise: 189900, comparePricePaise: 229900, stock: 25, isAvailable: true },
        { id: 'v_box_royal', sku: 'SR-GIFT-ROYAL', packSize: 'Royal 8-Spice & Munnar Tea Chest (700g net)', unit: 'box', pricePaise: 299900, comparePricePaise: 350000, stock: 15, isAvailable: true }
      ],
      rating: 5.0,
      reviewCount: 19,
      tags: ['gift box', 'luxury', 'hamper', 'corporate'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod_roasted_almond_chocolate',
      name: 'Munnar Roasted Almond Dark Chocolate',
      slug: 'munnar-roasted-almond-dark-chocolate',
      category: 'chocolates',
      shortDescription: 'Handmade 65% single-origin dark chocolate embedded with crunchy slow-roasted Californian almonds.',
      description: 'Prepared in small batches in Munnar hill station. We combine pure cocoa butter and rich chocolate liquor with golden roasted almonds for a velvety snap and rich bittersweet crunch.',
      origin: 'Handcrafted in Munnar, Kerala',
      ingredients: ['Cocoa Beans', 'Cocoa Butter', 'Roasted Almonds', 'Unrefined Sugar', 'Natural Vanilla Extract'],
      storageInfo: 'Store in a cool, dry place between 15°C and 20°C.',
      usageTips: 'Pair with Kolukkumalai black tea or savour as an evening treat.',
      images: [
        'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=1000&q=80'
      ],
      isFeatured: true,
      isPublished: true,
      variants: [
        { id: 'v_choc_150', sku: 'SR-CHOC-150G', packSize: '150 g', unit: 'g', pricePaise: 24000, comparePricePaise: 28000, stock: 50, isAvailable: true },
        { id: 'v_choc_300', sku: 'SR-CHOC-300G', packSize: '300 g', unit: 'g', pricePaise: 45000, comparePricePaise: 52000, stock: 35, isAvailable: true }
      ],
      rating: 4.9,
      reviewCount: 28,
      tags: ['chocolate', 'munnar', 'almonds', 'handmade'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  db.setProducts(products);

  // 3. Admin & Demo User
  const adminSalt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', adminSalt);
  const demoSalt = await bcrypt.genSalt(10);
  const demoPasswordHash = await bcrypt.hash('Customer123!', demoSalt);

  const existingUsers = db.getUsers();
  if (!existingUsers.some(u => u.role === 'admin')) {
    db.createUser({
      name: 'Spice Roots Admin',
      email: 'admin@spiceroots.in',
      passwordHash: adminPasswordHash,
      role: 'admin',
      phone: '+91 94882 12345',
      addresses: [
        {
          name: 'Spice Roots Admin Office',
          phone: '+91 94882 12345',
          addressLine: 'Post Office Junction',
          landmark: 'Opposite Plantation Club',
          city: 'Munnar',
          state: 'Kerala',
          pincode: '685612',
          isDefault: true
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('👤 [Seed] Created Admin user: admin@spiceroots.in / AdminPassword123!');
  }

  if (!existingUsers.some(u => u.email === 'customer@spiceroots.in')) {
    db.createUser({
      name: 'Rohan Sharma',
      email: 'customer@spiceroots.in',
      passwordHash: demoPasswordHash,
      role: 'customer',
      phone: '+91 98765 43210',
      addresses: [
        {
          name: 'Rohan Sharma',
          phone: '+91 98765 43210',
          addressLine: 'Flat 402, Green Meadows Apartment',
          landmark: 'Near Indiranagar Metro',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038',
          isDefault: true
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('👤 [Seed] Created Demo Customer: customer@spiceroots.in / Customer123!');
  }

  // 4. Coupons
  const coupons: ICoupon[] = [
    {
      id: 'cpn_welcome10',
      code: 'WELCOME10',
      discountType: 'percent',
      discountValue: 10,
      minOrderValuePaise: 49900,
      maxDiscountPaise: 20000,
      expiryDate: '2027-12-31T23:59:59.000Z',
      usageLimit: 1000,
      timesUsed: 12,
      isActive: true
    },
    {
      id: 'cpn_kerala20',
      code: 'KERALA20',
      discountType: 'percent',
      discountValue: 20,
      minOrderValuePaise: 99900,
      maxDiscountPaise: 50000,
      expiryDate: '2027-12-31T23:59:59.000Z',
      usageLimit: 500,
      timesUsed: 8,
      isActive: true
    },
    {
      id: 'cpn_freeship',
      code: 'FREESHIP',
      discountType: 'flat',
      discountValue: 6000, // ₹60 discount covering standard shipping
      minOrderValuePaise: 49900,
      expiryDate: '2027-12-31T23:59:59.000Z',
      timesUsed: 3,
      isActive: true
    }
  ];

  db.setCoupons(coupons);

  // 5. Sample verified initial reviews
  db.createReview({
    productId: 'prod_black_pepper',
    customerName: 'Ananya Nair (Kochi)',
    rating: 5,
    comment: 'The aroma when you grind this pepper is unforgettable. Night and day difference from supermarket pepper.',
    isVerifiedPurchase: true,
    createdAt: new Date().toISOString()
  });

  db.createReview({
    productId: 'prod_green_cardamom_8mm',
    customerName: 'Chef Vikramaditya (Mumbai)',
    rating: 5,
    comment: 'True 8mm bold cardamom pods, intensely green and dripping with sweet essential oil. Ideal for restaurant biryanis.',
    isVerifiedPurchase: true,
    createdAt: new Date().toISOString()
  });

  db.createReview({
    productId: 'prod_kolukkumalai_tea',
    customerName: 'Priya Sundaram (Chennai)',
    rating: 5,
    comment: 'Having visited Kolukkumalai in person, this brings back the mist and sunrise taste in every single cup.',
    isVerifiedPurchase: true,
    createdAt: new Date().toISOString()
  });

  // 6. Seed a sample past order for demo & dashboard metrics
  const existingOrders = db.getOrders();
  if (existingOrders.length === 0) {
    db.createOrder({
      orderNumber: 'SR-2026-91823',
      customerEmail: 'customer@spiceroots.in',
      customerName: 'Rohan Sharma',
      customerPhone: '+91 98765 43210',
      shippingAddress: {
        name: 'Rohan Sharma',
        phone: '+91 98765 43210',
        addressLine: 'Flat 402, Green Meadows Apartment',
        landmark: 'Near Indiranagar Metro',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038'
      },
      items: [
        {
          productId: 'prod_black_pepper',
          productName: 'Malabar Tellicherry Black Pepper (Garbled)',
          productSlug: 'malabar-black-pepper',
          variantId: 'v_bp_250',
          sku: 'SR-BP-250G',
          packSize: '250 g',
          unitPricePaise: 38000,
          quantity: 2,
          lineTotalPaise: 76000,
          image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1000&q=80'
        },
        {
          productId: 'prod_green_cardamom_8mm',
          productName: 'Alleppey Green Cardamom — 8mm Super Bold',
          productSlug: 'alleppey-green-cardamom-8mm',
          variantId: 'v_gc_100',
          sku: 'SR-GC-100G',
          packSize: '100 g',
          unitPricePaise: 52000,
          quantity: 1,
          lineTotalPaise: 52000,
          image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=1000&q=80'
        }
      ],
      priceBreakdown: {
        subtotalPaise: 128000,
        discountPaise: 12800, // 10% discount
        shippingFeePaise: 0,   // Order above ₹999 free shipping
        taxPaise: 5760,
        totalPaise: 120960
      },
      couponCode: 'WELCOME10',
      paymentMethod: 'razorpay',
      paymentStatus: 'paid',
      razorpayOrderId: 'order_test_demoroot123',
      razorpayPaymentId: 'pay_test_demopay456',
      fulfillmentStatus: 'processing',
      courierName: 'Blue Dart Express',
      trackingNumber: 'BD749281045IN',
      statusHistory: [
        { status: 'confirmed', timestamp: new Date(Date.now() - 86400000).toISOString(), note: 'Payment verified via Razorpay' },
        { status: 'processing', timestamp: new Date(Date.now() - 43200000).toISOString(), note: 'Packed at Munnar Plantation Depot' }
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  console.log('✅ [Seed] Successfully seeded catalog, categories, users, coupons, and orders!');
}

if (process.argv[1]?.endsWith('seed.ts')) {
  runSeed(true).then(() => {
    console.log('🌱 Seed execution finished.');
    process.exit(0);
  }).catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
}
