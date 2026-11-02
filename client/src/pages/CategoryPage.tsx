import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { IProduct, ICategory } from '../types/index.js';
import { ProductCard } from '../components/ProductCard.js';
import { ChevronRight, Sparkles } from 'lucide-react';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [currentCategory, setCurrentCategory] = useState<ICategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCategoryData() {
      if (!slug) return;
      setIsLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          api.getProducts({ category: slug, limit: 24 }),
          api.getCategories()
        ]);

        if (prodRes.success && prodRes.data) {
          setProducts(prodRes.data.products);
        }
        if (catRes.success && catRes.data) {
          const matched = catRes.data.find((c: ICategory) => c.slug.toLowerCase() === slug.toLowerCase());
          setCurrentCategory(matched || null);
        }
      } catch (err) {
        console.warn('Failed to load category products:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCategoryData();
  }, [slug]);

  const categoryTitles: Record<string, { title: string; subtitle: string }> = {
    spices: {
      title: 'Whole & Ground Western Ghats Spices',
      subtitle: 'Sun-cured Malabar black peppercorns, 8mm green cardamom, Ceylon cinnamon, and aromatic cloves.'
    },
    masalas: {
      title: 'Artisan Stone-Ground Masalas',
      subtitle: 'Slow-roasted traditional spice blends crafted without preservatives, artificial colors, or fillers.'
    },
    tea: {
      title: 'Munnar & High-Grown Teas',
      subtitle: 'Single-estate orthodox whole leaf, white silver tips, and brisk morning CTC teas from Kolukkumalai.'
    },
    essential_oils: {
      title: 'Pure Steam-Distilled Essential Oils',
      subtitle: 'Natural lemongrass, rosemary, and cold-pressed virgin coconut oil direct from plantation stills.'
    },
    gift_boxes: {
      title: 'Handcrafted Spice Caskets & Hampers',
      subtitle: 'Artisan rosewood boxes and celebration gift sets housing our finest export-grade harvests.'
    },
    chocolates: {
      title: 'Handmade Munnar Chocolates',
      subtitle: 'Rich cocoa chocolates infused with roasted plantation nuts and delicate spices.'
    }
  };

  const meta = categoryTitles[slug || ''] || {
    title: currentCategory?.name || 'Western Ghats Harvests',
    subtitle: currentCategory?.description || 'Explore our authentic direct-from-plantation selections.'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#77766E]">
        <Link to="/" className="hover:text-[#D0AE70]">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/shop" className="hover:text-[#D0AE70]">Catalog</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#171814] font-bold capitalize">{slug?.replace('_', ' ')}</span>
      </nav>

      {/* Category Editorial Banner */}
      <div className="bg-[#171814] text-[#F7F2E8] p-8 sm:p-12 rounded-3xl border border-[#D0AE70]/30 relative overflow-hidden shadow-xl">
        <div className="max-w-2xl relative z-10 space-y-3">
          <span className="text-xs font-bold text-[#D0AE70] uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Curated Single-Origin Collection
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#F7F2E8]">
            {meta.title}
          </h1>
          <p className="text-xs sm:text-sm text-[#D8D0C0] leading-relaxed font-light">
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Products Grid (2-Column Mobile Meesho Style) */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-white rounded-xl border border-[#E5DED0] animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-[#E5DED0] p-8 shadow-xs">
          <h3 className="font-editorial text-xl font-bold text-[#171814] mb-2">
            No products currently in this collection
          </h3>
          <p className="text-xs text-[#77766E] mb-6">
            New harvests are curing. Check back soon or view our other collections.
          </p>
          <Link
            to="/shop"
            className="bg-[#D0AE70] text-[#171814] text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-full hover:bg-[#B99153] transition-all inline-block"
          >
            View All Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

    </div>
  );
};
