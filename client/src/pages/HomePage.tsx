import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { IProduct, ICategory, IReview } from '../types/index.js';
import { ProductCard } from '../components/ProductCard.js';
import {
  ArrowRight, Sparkles, ShieldCheck, Leaf,
  Award, Heart, ChevronRight, Star, Clock, Flame
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.getProducts({ featured: true, limit: 8 }),
          api.getCategories()
        ]);
        if (prodRes.success && prodRes.data) {
          setFeaturedProducts(prodRes.data.products);
        }
        if (catRes.success && catRes.data) {
          setCategories(catRes.data);
        }
      } catch (err) {
        console.warn('Error loading home data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const recipes = [
    {
      title: 'Royal Malabar Dum Biryani',
      time: '45 mins',
      difficulty: 'Medium',
      description: 'Slow-cooked fragrant basmati infused with crushed 8mm green cardamom, star anise, and stone-ground garam masala.',
      spicesUsed: ['Alleppey Green Cardamom', 'Royal Garam Masala', 'Whole Star Anise'],
      image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
      categoryLink: '/category/masalas'
    },
    {
      title: 'Munnar Spiced Kadak Chai',
      time: '10 mins',
      difficulty: 'Easy',
      description: 'Vigorous morning milk chai steeped with high-grown Thalayar CTC leaf, crushed ginger, and whole Wayanad cloves.',
      spicesUsed: ['Thalayar Estate CTC Tea', 'Wayanad Cloves', 'Green Cardamom'],
      image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=800&q=80',
      categoryLink: '/category/tea'
    },
    {
      title: 'Kerala Fish Moilee (Coconut Stew)',
      time: '25 mins',
      difficulty: 'Easy',
      description: 'Mild, silky coconut milk stew tempered in cold-pressed virgin coconut oil with freshly cracked Tellicherry black pepper.',
      spicesUsed: ['Tellicherry Black Pepper', 'Virgin Coconut Oil', 'Cinnamon Quills'],
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
      categoryLink: '/category/spices'
    }
  ];

  const genuineReviews = [
    {
      name: 'Chef Vikramaditya S.',
      location: 'Mumbai',
      product: 'Alleppey Green Cardamom — 8mm Super Bold',
      rating: 5,
      comment: 'True 8mm bold cardamom pods, intensely green and dripping with sweet essential oil. Ideal for restaurant biryanis.'
    },
    {
      name: 'Ananya Nair',
      location: 'Kochi',
      product: 'Malabar Tellicherry Black Pepper',
      rating: 5,
      comment: 'The aroma when you crack this pepper is unforgettable. Night and day difference from regular commercial peppercorns.'
    },
    {
      name: 'Priya Sundaram',
      location: 'Chennai',
      product: 'Kolukkumalai High-Peak Orthodox Black Tea',
      rating: 5,
      comment: 'Having visited Kolukkumalai in person, this brings back the mist and sunrise taste in every single cup. Exquisite.'
    }
  ];

  return (
    <div className="space-y-20 pb-20">

      {/* 1. HERO SECTION */}
      <section className="relative min-h-[580px] lg:min-h-[640px] flex items-center justify-center bg-[#171814] overflow-hidden">
        {/* Minimalist Texture Background with luxury estate lighting & gradients */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero_minimalist_texture.jpg"
            alt="Minimalist Kerala Estate Texture Background"
            className="w-full h-full object-cover object-center opacity-60 scale-100 transition-opacity duration-700"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/hero_banner.png';
            }}
          />
          {/* Ambient lighting & smooth gradient vignettes */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#171814]/95 via-[#171814]/80 to-[#171814]/90" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_25%,rgba(208,174,112,0.18),transparent_65%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(67,91,67,0.3),transparent_50%)]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center sm:text-left flex flex-col justify-center">
          <div className="max-w-2xl space-y-6">

            <div className="inline-flex items-center gap-2 bg-[#D0AE70]/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#D0AE70]/40 text-[#D0AE70] text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Direct Harvest from Munnar & Western Ghats</span>
            </div>

            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#e5e1e4] leading-[1.15] tracking-tight">
              Rarest Terroirs. <span className="text-[#d4af37] italic font-normal">Untamed Aromas.</span>
            </h1>

            <p className="text-sm sm:text-base text-[#d0c5af] leading-relaxed max-w-xl font-normal">
              Sun-cured 4.5mm Tellicherry peppercorns, 8mm bold emerald cardamom, true Ceylon cinnamon quills, and single-estate Kolukkumalai orthodox teas harvested at 7,900 ft.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <Link
                to="/shop"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#d4af37] text-[#131315] hover:bg-[#f2ca50] px-8 py-3.5 rounded-lg text-xs sm:text-sm font-bold uppercase tracking-widest shadow-lg hover:shadow-[0_0_24px_rgba(212,175,55,0.4)] transition-all duration-300 group font-sans"
              >
                <span>Explore The Archive</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/category/tea"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1c1b1d] text-[#e5e1e4] hover:bg-[#201f22] hover:text-[#d4af37] px-7 py-3.5 rounded-lg text-xs sm:text-sm font-semibold tracking-wider border border-[#d4af37]/35 transition-colors font-sans"
              >
                Explore Munnar Teas
              </Link>
            </div>

            {/* Quick Micro-Trust badges */}
            <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-center sm:justify-start gap-6 text-xs text-[#d0c5af]">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#d4af37]" />
                Zero Synthetic Additives
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#d4af37]" />
                Non-Irradiated Whole Pods
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#d4af37]" />
                Pan-India Express Delivery
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* 2. VALUE PROPOSITION STRIP (Stitch Reputation Strip Style) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-[#1c1b1d] p-8 rounded-xl border border-[#353437] shadow-xl">

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#201f22] border border-[#d4af37]/25 flex items-center justify-center shrink-0 text-[#d4af37]">
              <Leaf className="w-6 h-6 text-[#d4af37]" />
            </div>
            <div>
              <h4 className="font-editorial text-base font-bold text-[#e5e1e4]">Single-Origin Hills</h4>
              <p className="text-xs text-[#d0c5af] mt-1 leading-relaxed">
                Direct from verified shade plantations in Idukki, Munnar, and Wayanad.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#201f22] border border-[#d4af37]/25 flex items-center justify-center shrink-0 text-[#d4af37]">
              <Flame className="w-6 h-6 text-[#d4af37]" />
            </div>
            <div>
              <h4 className="font-editorial text-base font-bold text-[#e5e1e4]">Peak Essential Oils</h4>
              <p className="text-xs text-[#d0c5af] mt-1 leading-relaxed">
                High piperine and eugenol retention through traditional slow drying.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#201f22] border border-[#d4af37]/25 flex items-center justify-center shrink-0 text-[#d4af37]">
              <ShieldCheck className="w-6 h-6 text-[#d4af37]" />
            </div>
            <div>
              <h4 className="font-editorial text-base font-bold text-[#e5e1e4]">Zero Adulteration</h4>
              <p className="text-xs text-[#d0c5af] mt-1 leading-relaxed">
                Never mixed with spent spices, synthetic aroma sprays, or fillers.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#201f22] border border-[#d4af37]/25 flex items-center justify-center shrink-0 text-[#d4af37]">
              <Award className="w-6 h-6 text-[#d4af37]" />
            </div>
            <div>
              <h4 className="font-editorial text-base font-bold text-[#e5e1e4]">Master-Graded Lots</h4>
              <p className="text-xs text-[#d0c5af] mt-1 leading-relaxed">
                Hand-screened 8mm cardamom and Tellicherry garbled black pepper.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. FEATURED COLLECTIONS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-8">
          <div>
            <span className="text-xs font-bold text-[#d4af37] uppercase tracking-widest block mb-1 font-sans">
              Curated Harvests
            </span>
            <h2 className="font-editorial text-3xl font-bold text-[#e5e1e4]">
              Explore by Category
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs font-bold text-[#d0c5af] hover:text-[#d4af37] flex items-center gap-1 transition-colors group font-sans uppercase tracking-wider"
          >
            <span>View All Categories</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="group rounded-xl overflow-hidden p-3.5 flex flex-col items-center text-center bg-[#1c1b1d] border border-[#353437] hover:border-[#d4af37]/60 hover:shadow-[0_12px_36px_-8px_rgba(0,0,0,0.9),0_0_24px_0_rgba(212,175,55,0.18)] transition-all duration-300"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-[#0e0e10] mb-3 border-2 border-[#353437] group-hover:border-[#d4af37] transition-colors">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <h3 className="font-editorial text-sm font-bold text-[#e5e1e4] group-hover:text-[#d4af37] transition-colors line-clamp-1">
                {cat.name}
              </h3>
              <p className="text-[11px] text-[#99907c] mt-0.5 font-sans">
                {cat.itemCount ? `${cat.itemCount} items` : 'Explore'}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. BEST SELLING PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-8">
          <div>
            <span className="text-xs font-bold text-[#c25e2e] uppercase tracking-widest block mb-1 font-sans">
              Plantation Favorites
            </span>
            <h2 className="font-editorial text-3xl font-bold text-[#e5e1e4]">
              Best-Selling Western Ghats Spices
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs font-bold text-[#d0c5af] hover:text-[#d4af37] flex items-center gap-1 transition-colors group font-sans uppercase tracking-wider"
          >
            <span>See Entire Catalog</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-[#1c1b1d] rounded-xl border border-[#353437] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 5. BRAND STORY: "FROM THE WESTERN GHATS TO YOUR KITCHEN" */}
      <section className="bg-[#0e0e10] text-[#e5e1e4] py-20 relative overflow-hidden border-y border-[#2a261d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37] flex items-center gap-2 font-sans">
                <Sparkles className="w-4 h-4" />
                Our Sourcing & Heritage
              </span>

              <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#e5e1e4] leading-tight">
                From The Mist-Clad Western Ghats Directly To Your Kitchen.
              </h2>

              <p className="text-sm text-[#d0c5af] leading-relaxed font-light">
                For millennia, the rainforests of the Malabar Coast have gifted the world its most prized flavors. Today, commercial supply chains often extract the precious volatile oils from whole spices before grinding, leaving consumers with faint aroma and bland heat.
              </p>

              <p className="text-sm text-[#d0c5af] leading-relaxed font-light">
                At <strong className="text-[#e5e1e4]">Spice Roots</strong>, we partner directly with generational smallholders in Munnar, Vandanmedu, and Wayanad. Our harvests are dried naturally on woven mats under the Kerala sun, sealed at the source, and delivered with 100% of their therapeutic botanicals and rich aroma intact.
              </p>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#2a261d]">
                <div>
                  <span className="font-editorial text-2xl sm:text-3xl font-bold text-[#d4af37] block">
                    7,900 ft
                  </span>
                  <span className="text-[11px] text-[#99907c] uppercase tracking-wider font-sans">Kolukkumalai Elevation</span>
                </div>
                <div>
                  <span className="font-editorial text-2xl sm:text-3xl font-bold text-[#d4af37] block">
                    8.0 mm
                  </span>
                  <span className="text-[11px] text-[#99907c] uppercase tracking-wider font-sans">Super Bold Cardamom</span>
                </div>
                <div>
                  <span className="font-editorial text-2xl sm:text-3xl font-bold text-[#d4af37] block">
                    100%
                  </span>
                  <span className="text-[11px] text-[#99907c] uppercase tracking-wider font-sans">Direct Estate Trade</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#d4af37] hover:text-[#f2ca50] transition-colors underline decoration-[#d4af37]/40 font-sans"
                >
                  Read Our Full Story →
                </Link>
              </div>
            </div>

            {/* Visual Collage */}
            <div className="relative">
              <div className="aspect-4/3 rounded-2xl overflow-hidden border border-[#d4af37]/35 shadow-2xl bg-[#1c1b1d]">
                <img
                  src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80"
                  alt="Authentic Kerala Spices"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-[#1c1b1d] p-5 rounded-xl shadow-2xl border border-[#353437] hidden sm:block max-w-[220px]">
                <p className="text-xs font-bold text-[#d4af37] uppercase tracking-wider font-sans">Single-Estate Harvest</p>
                <p className="text-[10px] text-[#d0c5af] mt-1 leading-relaxed">
                  Packed within 48 hours of sorting to lock in maximum volatile aromatic potency.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. RECIPE INSPIRATION SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#d4af37] uppercase tracking-widest block mb-1 font-sans">
            Plantation Kitchen
          </span>
          <h2 className="font-editorial text-3xl font-bold text-[#e5e1e4]">
            Recipe Inspiration &amp; Spices Used
          </h2>
          <p className="text-xs sm:text-sm text-[#d0c5af] mt-2">
            Elevate your culinary creations with authentic heritage recipes celebrating the traditional soul of Kerala.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {recipes.map((recipe, idx) => (
            <div
              key={idx}
              className="rounded-xl overflow-hidden bg-[#1c1b1d] border border-[#353437] hover:border-[#d4af37]/50 shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-16/10 overflow-hidden bg-[#0e0e10]">
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-[#0e0e10]/90 backdrop-blur-xs text-[#e5e1e4] text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-[#d4af37]/30">
                    <Clock className="w-3 h-3 text-[#d4af37]" />
                    <span>{recipe.time}</span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-editorial text-lg font-bold text-[#e5e1e4] mb-2">
                    {recipe.title}
                  </h3>
                  <p className="text-xs text-[#d0c5af] leading-relaxed mb-4">
                    {recipe.description}
                  </p>

                  <div className="bg-[#201f22] p-3 rounded-lg border border-[#353437]">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#d4af37] block mb-1.5 font-sans">
                      Key Spices:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {recipe.spicesUsed.map((sp, sIdx) => (
                        <span key={sIdx} className="text-[11px] bg-[#131315] text-[#dccf96] px-2 py-0.5 rounded-md font-medium border border-[#353437]">
                          {sp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Link
                  to={recipe.categoryLink}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-[#d4af37] text-[#131315] hover:bg-[#f2ca50] text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm font-sans"
                >
                  <span>Explore Ingredients</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. GENUINE VERIFIED REVIEWS */}
      <section className="bg-[#0e0e10] py-16 border-y border-[#2a261d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold text-[#c25e2e] uppercase tracking-widest block mb-1 font-sans">
              Verified Impressions
            </span>
            <h2 className="font-editorial text-3xl font-bold text-[#e5e1e4]">
              Loved by Chefs &amp; Connoisseurs
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {genuineReviews.map((rev, idx) => (
              <div
                key={idx}
                className="bg-[#1c1b1d] p-6 rounded-xl border border-[#353437] shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-[#d4af37] mb-3">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-[#d0c5af] italic leading-relaxed mb-4">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="pt-3 border-t border-[#353437] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#e5e1e4] font-editorial">{rev.name}</h4>
                    <p className="text-[10px] text-[#99907c] font-sans">{rev.location}</p>
                  </div>
                  <span className="text-[10px] bg-[#435b43]/20 text-[#dccf96] font-semibold px-2 py-0.5 rounded-full border border-[#435b43]/40">
                    Verified Buyer
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CALL TO ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#1c1b1d] rounded-2xl p-8 sm:p-12 text-center text-[#e5e1e4] border border-[#d4af37]/35 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <span className="text-xs font-bold text-[#d4af37] uppercase tracking-widest block font-sans">
              Gourmet Heritage Awaits
            </span>
            <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#e5e1e4]">
              Taste The Difference of Genuine Single-Origin Spices
            </h2>
            <p className="text-xs sm:text-sm text-[#d0c5af] leading-relaxed font-light">
              Order fresh crops today. Enjoy complimentary courier dispatch across India on all orders over ₹499.
            </p>
            <div className="pt-4 flex justify-center gap-4">
              <Link
                to="/shop"
                className="bg-[#d4af37] text-[#131315] hover:bg-[#f2ca50] font-bold text-xs sm:text-sm uppercase tracking-widest px-8 py-3.5 rounded-lg shadow-lg hover:shadow-[0_0_24px_rgba(212,175,55,0.4)] transition-all font-sans"
              >
                Shop All Spices Now
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

function CheckCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
