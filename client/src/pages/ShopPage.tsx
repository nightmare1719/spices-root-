import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { IProduct, ICategory } from '../types/index.js';
import { ProductCard } from '../components/ProductCard.js';
import { 
  Filter, Search, X, SlidersHorizontal, ArrowUpDown, 
  ChevronLeft, ChevronRight, RotateCcw, Sparkles 
} from 'lucide-react';

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalItems: 0,
    totalPages: 1
  });

  // Filter states initialized from URL params
  const categoryParam = searchParams.get('category') || 'all';
  const searchParam = searchParams.get('search') || '';
  const sortParam = searchParams.get('sort') || 'featured';
  const inStockParam = searchParams.get('inStock') === 'true';
  const maxPriceParam = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : 3000;
  const pageParam = searchParams.get('page') ? Number(searchParams.get('page')) : 1;

  const [searchInput, setSearchInput] = useState(searchParam);
  const [maxPrice, setMaxPrice] = useState(maxPriceParam);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.getCategories();
        if (res.success && res.data) {
          setCategories(res.data);
        }
      } catch (err) {
        console.warn('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    async function fetchCatalog() {
      setIsLoading(true);
      try {
        const res = await api.getProducts({
          category: categoryParam !== 'all' ? categoryParam : undefined,
          search: searchParam || undefined,
          sort: sortParam,
          maxPrice: maxPriceParam < 3000 ? maxPriceParam : undefined,
          inStock: inStockParam || undefined,
          page: pageParam,
          limit: 12
        });

        if (res.success && res.data) {
          setProducts(res.data.products);
          setPagination(res.data.pagination);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCatalog();
  }, [categoryParam, searchParam, sortParam, inStockParam, maxPriceParam, pageParam]);

  const updateParam = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === null || value === '' || value === 'all') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    // Reset to page 1 on filter changes
    if (key !== 'page') {
      newParams.delete('page');
    }
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('search', searchInput.trim() || null);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setMaxPrice(3000);
    setSearchParams({});
  };

  const hasActiveFilters = categoryParam !== 'all' || searchParam || sortParam !== 'featured' || inStockParam || maxPriceParam < 3000;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-[#FAF7F2] p-6 sm:p-10 rounded-3xl border border-[#EFE8D6] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-[#C5A059] uppercase tracking-widest block mb-1">
            Plantation Sourced • 100% Pure
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#153E2B]">
            Western Ghats Spice Catalog
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-xl">
            Browse our sun-cured peppercorns, emerald cardamom pods, rare high-peak teas, and handcrafted gift hampers.
          </p>
        </div>

        {/* Live Search Input */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search spices, cardamom, tea..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-[#EFE8D6] rounded-full focus:outline-hidden focus:border-[#C5A059] shadow-2xs"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                updateParam('search', null);
              }}
              className="absolute right-3 top-3 text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      {/* Main Grid: Sidebar Filters + Products */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#EFE8D6] space-y-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h3 className="font-editorial text-base font-bold text-[#153E2B] flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#C5A059]" />
                <span>Filters</span>
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-[#B85D3A] hover:underline font-semibold flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-3">
                Category
              </h4>
              <div className="space-y-1.5">
                <button
                  onClick={() => updateParam('category', 'all')}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg font-medium transition-colors flex justify-between items-center ${
                    categoryParam === 'all'
                      ? 'bg-[#153E2B] text-white font-bold'
                      : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span>All Products</span>
                  <span className="text-[10px] opacity-70">{pagination.totalItems}</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateParam('category', cat.slug)}
                    className={`w-full text-left text-xs px-3 py-2 rounded-lg font-medium transition-colors flex justify-between items-center ${
                      categoryParam === cat.slug
                        ? 'bg-[#153E2B] text-white font-bold'
                        : 'text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] opacity-70">{cat.itemCount || ''}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="pt-4 border-t border-stone-100">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Max Price
                </h4>
                <span className="text-xs font-bold text-[#153E2B]">₹{maxPrice}</span>
              </div>
              <input
                type="range"
                min="100"
                max="3000"
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                onMouseUp={() => updateParam('maxPrice', String(maxPrice))}
                onTouchEnd={() => updateParam('maxPrice', String(maxPrice))}
                className="w-full accent-[#153E2B] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                <span>₹100</span>
                <span>₹3,000+</span>
              </div>
            </div>

            {/* In-Stock Toggle */}
            <div className="pt-4 border-t border-stone-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-700">
                <input
                  type="checkbox"
                  checked={inStockParam}
                  onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : null)}
                  className="rounded text-[#153E2B] focus:ring-[#153E2B] cursor-pointer"
                />
                <span className="font-semibold">In-Stock Items Only</span>
              </label>
            </div>

          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Top Controls: Mobile filter trigger + Sort Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#EFE8D6] shadow-2xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-1.5 text-xs font-bold bg-[#153E2B] text-white px-3 py-1.5 rounded-lg"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
              </button>
              <p className="text-xs text-stone-500">
                Showing <strong className="text-[#153E2B]">{products.length}</strong> of{' '}
                <strong className="text-[#153E2B]">{pagination.totalItems}</strong> products
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" />
                Sort:
              </span>
              <select
                value={sortParam}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="text-xs bg-[#FCFAF6] border border-[#EFE8D6] rounded-lg px-2.5 py-1.5 text-stone-700 font-medium focus:outline-hidden focus:border-[#C5A059]"
              >
                <option value="featured">Featured First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest Harvests</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Active Filter Tags */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {categoryParam !== 'all' && (
                <span className="inline-flex items-center gap-1 text-xs bg-[#153E2B]/10 text-[#153E2B] px-3 py-1 rounded-full font-semibold">
                  Category: {categoryParam}
                  <button onClick={() => updateParam('category', null)}><X className="w-3 h-3" /></button>
                </span>
              )}
              {searchParam && (
                <span className="inline-flex items-center gap-1 text-xs bg-[#153E2B]/10 text-[#153E2B] px-3 py-1 rounded-full font-semibold">
                  Query: "{searchParam}"
                  <button onClick={() => updateParam('search', null)}><X className="w-3 h-3" /></button>
                </span>
              )}
              {maxPriceParam < 3000 && (
                <span className="inline-flex items-center gap-1 text-xs bg-[#153E2B]/10 text-[#153E2B] px-3 py-1 rounded-full font-semibold">
                  Max: ₹{maxPriceParam}
                  <button onClick={() => updateParam('maxPrice', null)}><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-white rounded-2xl border border-stone-200 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-[#EFE8D6] p-8">
              <Sparkles className="w-12 h-12 text-[#C5A059]/40 mx-auto mb-3" />
              <h3 className="font-editorial text-xl font-bold text-[#153E2B] mb-2">
                No matching harvests found
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto mb-6">
                We couldn't find any products matching your specific search or price filter. Try clearing filters to see our full Western Ghats collection.
              </p>
              <button
                onClick={clearAllFilters}
                className="bg-[#153E2B] text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-full hover:bg-[#1E5138] transition-all"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <button
                disabled={pageParam <= 1}
                onClick={() => updateParam('page', String(pageParam - 1))}
                className="p-2 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {[...Array(pagination.totalPages)].map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => updateParam('page', String(p))}
                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-colors ${
                      p === pageParam
                        ? 'bg-[#153E2B] text-white'
                        : 'border border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                disabled={pageParam >= pagination.totalPages}
                onClick={() => updateParam('page', String(pageParam + 1))}
                className="p-2 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Mobile Filters Slide-in Modal */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
          <div 
            onClick={() => setIsMobileFiltersOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
          />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xs bg-white p-6 shadow-2xl flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b">
                  <h3 className="font-editorial text-lg font-bold text-[#153E2B]">Catalog Filters</h3>
                  <button onClick={() => setIsMobileFiltersOpen(false)}><X className="w-5 h-5 text-stone-500" /></button>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-stone-700 mb-2">Categories</h4>
                  <div className="space-y-1">
                    <button
                      onClick={() => { updateParam('category', 'all'); setIsMobileFiltersOpen(false); }}
                      className="block w-full text-left text-xs py-1.5 font-medium text-stone-700"
                    >
                      All Products
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { updateParam('category', c.slug); setIsMobileFiltersOpen(false); }}
                        className="block w-full text-left text-xs py-1.5 font-medium text-stone-700"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-xs font-bold uppercase text-stone-700 mb-2">Max Price: ₹{maxPrice}</h4>
                  <input
                    type="range"
                    min="100"
                    max="3000"
                    step="50"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-[#153E2B]"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  updateParam('maxPrice', String(maxPrice));
                  setIsMobileFiltersOpen(false);
                }}
                className="w-full py-3 bg-[#153E2B] text-white text-xs font-bold rounded-xl"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
