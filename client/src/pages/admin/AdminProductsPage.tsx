import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { IProduct, IProductVariant } from '../../types/index.js';
import { formatINR } from '../../utils/format.js';
import { 
  Plus, Search, Edit2, Trash2, Download, 
  Check, X, Eye, EyeOff, Star, Sparkles 
} from 'lucide-react';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Edit / Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<IProduct> | null>(null);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.admin.getProducts({ search, category });
      if (res.success && res.data) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  const openCreateModal = () => {
    setEditingProduct({
      name: '',
      category: 'spices',
      shortDescription: '',
      description: '',
      origin: 'Idukki, Kerala',
      images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1000&q=80'],
      isFeatured: false,
      isPublished: true,
      variants: [
        {
          id: 'v_' + Date.now(),
          sku: 'SR-NEW-100G',
          packSize: '100 g',
          unit: 'g',
          pricePaise: 20000,
          comparePricePaise: 25000,
          stock: 50,
          isAvailable: true
        }
      ]
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prod: IProduct) => {
    setEditingProduct(JSON.parse(JSON.stringify(prod)));
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.variants?.length) return;

    try {
      if (editingProduct.id) {
        await api.admin.updateProduct(editingProduct.id, editingProduct);
      } else {
        await api.admin.createProduct(editingProduct);
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      await loadProducts();
    } catch (err) {
      alert((err as Error).message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.admin.deleteProduct(id);
      await loadProducts();
    } catch (err) {
      alert((err as Error).message || 'Failed to delete product');
    }
  };

  const handleTogglePublish = async (prod: IProduct) => {
    try {
      await api.admin.updateProduct(prod.id, { isPublished: !prod.isPublished });
      await loadProducts();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#153E2B]">
            Product & Inventory Management
          </h1>
          <p className="text-xs text-stone-500">
            Create crops, manage variants, adjust prices in paise/INR, and monitor stock levels.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/api/admin/products/export-csv"
            download
            className="inline-flex items-center gap-1.5 bg-white text-stone-700 hover:text-black border border-stone-200 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 bg-[#153E2B] text-white hover:bg-[#1E5138] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all"
          >
            <Plus className="w-4 h-4 text-[#D8B26E]" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-wrap gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-sm">
          <input
            id="admin-products-search"
            name="search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU..."
            className="w-full text-xs p-2 bg-[#FAF7F2] border border-stone-200 rounded-lg focus:outline-hidden focus:border-[#C5A059]"
          />
          <button type="submit" className="px-3 bg-[#153E2B] text-white rounded-lg text-xs font-bold">
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <label htmlFor="admin-products-category-filter" className="text-xs text-stone-500">Category:</label>
          <select
            id="admin-products-category-filter"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-xs bg-[#FAF7F2] border border-stone-200 rounded-lg p-2"
          >
            <option value="all">All Categories</option>
            <option value="spices">Whole Spices</option>
            <option value="masalas">Masala Blends</option>
            <option value="tea">Munnar Tea</option>
            <option value="essential_oils">Essential Oils</option>
            <option value="gift_boxes">Gift Boxes</option>
            <option value="chocolates">Chocolates</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-stone-600 uppercase text-[10px] tracking-wider border-b border-stone-200">
              <tr>
                <th className="p-4">Product Info</th>
                <th className="p-4">Category</th>
                <th className="p-4">Variants & Pricing</th>
                <th className="p-4">Total Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-stone-400">Loading catalog...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-stone-400">No products found.</td>
                </tr>
              ) : (
                products.map((prod) => {
                  const totalStock = prod.variants.reduce((sum, v) => sum + v.stock, 0);
                  return (
                    <tr key={prod.id} className="hover:bg-stone-50/70">
                      
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.images[0]}
                            alt={prod.name}
                            className="w-12 h-12 object-cover rounded-xl bg-stone-100 shrink-0 border border-stone-200"
                          />
                          <div>
                            <span className="font-bold text-[#153E2B] text-xs line-clamp-1 block">
                              {prod.name}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              Slug: {prod.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 capitalize text-stone-700 font-medium">
                        {prod.category.replace('_', ' ')}
                      </td>

                      <td className="p-4">
                        <div className="space-y-1">
                          {prod.variants.map((v) => (
                            <div key={v.id} className="text-[11px] flex items-center gap-2">
                              <span className="font-semibold text-stone-800">{v.packSize}:</span>
                              <span className="text-[#153E2B] font-bold">{formatINR(v.pricePaise)}</span>
                              <span className="text-stone-400 font-mono text-[10px]">({v.sku})</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          totalStock <= 15 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {totalStock} units
                        </span>
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => handleTogglePublish(prod)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                            prod.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {prod.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{prod.isPublished ? 'Published' : 'Hidden'}</span>
                        </button>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 text-stone-500 hover:text-[#153E2B] hover:bg-stone-100 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            className="p-1.5 text-stone-400 hover:text-[#B85D3A] hover:bg-stone-100 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Edit / Create Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-stone-200 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b">
              <h2 className="font-editorial text-xl font-bold text-[#153E2B]">
                {editingProduct.id ? 'Edit Product' : 'Add New Western Ghats Harvest'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label htmlFor="prod-name-input" className="block text-xs font-semibold text-stone-700 mb-1">Product Title *</label>
                <input
                  id="prod-name-input"
                  name="productName"
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="e.g. Malabar Tellicherry Black Pepper"
                  className="w-full text-xs p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prod-category-select" className="block text-xs font-semibold text-stone-700 mb-1">Category *</label>
                  <select
                    id="prod-category-select"
                    name="category"
                    value={editingProduct.category || 'spices'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as any })}
                    className="w-full text-xs p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl"
                  >
                    <option value="spices">Whole Spices</option>
                    <option value="masalas">Masala Blends</option>
                    <option value="tea">Munnar Tea</option>
                    <option value="essential_oils">Essential Oils</option>
                    <option value="gift_boxes">Gift Boxes</option>
                    <option value="chocolates">Chocolates</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="prod-origin-input" className="block text-xs font-semibold text-stone-700 mb-1">Origin Location</label>
                  <input
                    id="prod-origin-input"
                    name="origin"
                    type="text"
                    value={editingProduct.origin || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, origin: e.target.value })}
                    placeholder="e.g. Idukki, Munnar, Kerala"
                    className="w-full text-xs p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="prod-short-desc-input" className="block text-xs font-semibold text-stone-700 mb-1">Short Description</label>
                <input
                  id="prod-short-desc-input"
                  name="shortDescription"
                  type="text"
                  value={editingProduct.shortDescription || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })}
                  placeholder="One sentence summary for catalog cards"
                  className="w-full text-xs p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl"
                />
              </div>

              <div>
                <label htmlFor="prod-full-desc-input" className="block text-xs font-semibold text-stone-700 mb-1">Full Detailed Story & Description</label>
                <textarea
                  id="prod-full-desc-input"
                  name="description"
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full text-xs p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl"
                />
              </div>

              {/* DIRECT PRODUCT IMAGE LINK / URL FIELD */}
              <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex justify-between items-center">
                  <label htmlFor="prod-image-url-input" className="block text-xs font-bold text-[#153E2B]">
                    Product Image Link / Product URL *
                  </label>
                  <span className="text-[10px] text-stone-500">Supports direct web URLs & asset links</span>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-1 w-full">
                    <input
                      id="prod-image-url-input"
                      name="imageUrl"
                      type="url"
                      required
                      value={editingProduct.images?.[0] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const cur = editingProduct.images ? [...editingProduct.images] : [];
                        if (cur.length > 0) {
                          cur[0] = val;
                        } else {
                          cur.push(val);
                        }
                        setEditingProduct({ ...editingProduct, images: cur });
                      }}
                      placeholder="https://images.unsplash.com/... or https://your-domain.com/photo.jpg"
                      className="w-full text-xs p-2.5 bg-white border border-stone-200 rounded-xl font-mono focus:outline-hidden focus:border-[#C5A059]"
                    />
                  </div>

                  {/* Live Image Preview Thumbnail */}
                  <div className="w-14 h-14 rounded-xl border border-stone-300 bg-stone-100 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                    {editingProduct.images?.[0] ? (
                      <img
                        src={editingProduct.images[0]}
                        alt="Product Asset Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                    ) : (
                      <span className="text-[9px] text-stone-400 font-bold uppercase text-center px-1">No Image</span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-stone-400">
                  Enter a direct web URL of the product picture. This URL is saved directly to the product database for instant rendering across the storefront.
                </p>
              </div>

              {/* Variants Section */}
              <div className="pt-3 border-t border-stone-200 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#153E2B]">
                    Weight Variants & Pricing
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = editingProduct.variants || [];
                      setEditingProduct({
                        ...editingProduct,
                        variants: [
                          ...cur,
                          {
                            id: 'v_' + Date.now(),
                            sku: `SR-VAR-${cur.length + 1}`,
                            packSize: '250 g',
                            unit: 'g',
                            pricePaise: 35000,
                            comparePricePaise: 40000,
                            stock: 30,
                            isAvailable: true
                          }
                        ]
                      });
                    }}
                    className="text-xs font-bold text-[#153E2B] hover:text-[#C5A059]"
                  >
                    + Add Pack Variant
                  </button>
                </div>

                {editingProduct.variants?.map((v, vIdx) => (
                  <div key={v.id || vIdx} className="grid grid-cols-5 gap-2 bg-[#FAF7F2] p-3 rounded-xl items-center text-xs">
                    <div>
                      <label htmlFor={`variant-packsize-${vIdx}`} className="text-[10px] text-stone-500 block">Pack Size</label>
                      <input
                        id={`variant-packsize-${vIdx}`}
                        name={`variant_packSize_${vIdx}`}
                        type="text"
                        value={v.packSize}
                        onChange={(e) => {
                          const vars = [...(editingProduct.variants || [])];
                          vars[vIdx].packSize = e.target.value;
                          setEditingProduct({ ...editingProduct, variants: vars });
                        }}
                        className="w-full p-1.5 bg-white border border-stone-200 rounded text-xs"
                      />
                    </div>

                    <div>
                      <label htmlFor={`variant-price-${vIdx}`} className="text-[10px] text-stone-500 block">Price (INR ₹)</label>
                      <input
                        id={`variant-price-${vIdx}`}
                        name={`variant_price_${vIdx}`}
                        type="number"
                        value={v.pricePaise / 100}
                        onChange={(e) => {
                          const vars = [...(editingProduct.variants || [])];
                          vars[vIdx].pricePaise = Number(e.target.value) * 100;
                          setEditingProduct({ ...editingProduct, variants: vars });
                        }}
                        className="w-full p-1.5 bg-white border border-stone-200 rounded text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label htmlFor={`variant-stock-${vIdx}`} className="text-[10px] text-stone-500 block">Stock Units</label>
                      <input
                        id={`variant-stock-${vIdx}`}
                        name={`variant_stock_${vIdx}`}
                        type="number"
                        value={v.stock}
                        onChange={(e) => {
                          const vars = [...(editingProduct.variants || [])];
                          vars[vIdx].stock = Number(e.target.value);
                          setEditingProduct({ ...editingProduct, variants: vars });
                        }}
                        className="w-full p-1.5 bg-white border border-stone-200 rounded text-xs"
                      />
                    </div>

                    <div>
                      <label htmlFor={`variant-sku-${vIdx}`} className="text-[10px] text-stone-500 block">SKU</label>
                      <input
                        id={`variant-sku-${vIdx}`}
                        name={`variant_sku_${vIdx}`}
                        type="text"
                        value={v.sku}
                        onChange={(e) => {
                          const vars = [...(editingProduct.variants || [])];
                          vars[vIdx].sku = e.target.value;
                          setEditingProduct({ ...editingProduct, variants: vars });
                        }}
                        className="w-full p-1.5 bg-white border border-stone-200 rounded text-xs"
                      />
                    </div>

                    <div className="text-right pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          const vars = (editingProduct.variants || []).filter((_, i) => i !== vIdx);
                          setEditingProduct({ ...editingProduct, variants: vars });
                        }}
                        className="text-[#B85D3A] hover:underline text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Toggles */}
              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
                  <input
                    id="prod-is-published"
                    name="isPublished"
                    type="checkbox"
                    checked={editingProduct.isPublished}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isPublished: e.target.checked })}
                    className="rounded text-[#153E2B]"
                  />
                  <span>Published on Storefront</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
                  <input
                    id="prod-is-featured"
                    name="isFeatured"
                    type="checkbox"
                    checked={editingProduct.isFeatured}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })}
                    className="rounded text-[#153E2B]"
                  />
                  <span>Featured Estate Reserve</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 text-xs font-semibold text-stone-600 hover:text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#153E2B] text-white text-xs font-bold uppercase rounded-xl hover:bg-[#1E5138]"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
