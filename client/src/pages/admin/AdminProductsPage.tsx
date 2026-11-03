import React, { useState } from 'react';
import { API_BASE } from '../../services/api.js';
import { IProduct, IProductVariant } from '../../types/index.js';
import { formatINR } from '../../utils/format.js';
import { useProducts } from '../../context/ProductContext.js';
import { 
  Plus, Search, Edit2, Trash2, Download, 
  Check, X, Eye, EyeOff, Star, Sparkles 
} from 'lucide-react';

export const AdminProductsPage: React.FC = () => {
  const { products, isLoading, updateProduct, createProduct, deleteProduct } = useProducts();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  // Edit / Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<IProduct> | null>(null);

  // Derived filtered products list from synchronized global state
  const filteredProducts = products.filter(p => {
    const matchesCat = category === 'all' || p.category.toLowerCase() === category.toLowerCase();
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.variants.some(v => v.sku.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      const targetId = editingProduct._id || editingProduct.id;
      if (targetId) {
        // Direct MongoDB persistence with optimistic state update and rollback
        await updateProduct(targetId, editingProduct);
      } else {
        await createProduct(editingProduct);
      }
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      alert((err as Error).message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteProduct(id);
    } catch (err) {
      alert((err as Error).message || 'Failed to delete product');
    }
  };

  const handleTogglePublish = async (prod: IProduct) => {
    try {
      const targetId = prod._id || prod.id;
      if (targetId) {
        await updateProduct(targetId, { isPublished: !prod.isPublished });
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#e5e1e4]">
            Product & Inventory Management
          </h1>
          <p className="text-xs text-[#d0c5af]">
            Create crops, manage variants, adjust prices in paise/INR, and monitor stock levels.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={`${API_BASE}/admin/products/export-csv`}
            download
            className="inline-flex items-center gap-1.5 bg-[#1c1b1d] text-[#d0c5af] hover:text-[#e5e1e4] border border-[#353437] hover:border-[#d4af37]/40 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 bg-[#d4af37] text-[#131315] hover:bg-[#f2ca50] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#131315]" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#1c1b1d] p-4 rounded-2xl border border-[#353437] shadow-2xs flex flex-wrap gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-sm">
          <input
            id="admin-products-search"
            name="search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU..."
            className="w-full text-xs p-2 bg-[#0e0e10] border border-[#353437] rounded-lg text-[#e5e1e4] placeholder-[#99907c] focus:outline-hidden focus:border-[#d4af37]"
          />
          <button type="submit" className="px-3 bg-[#201f22] text-[#d4af37] border border-[#353437] hover:border-[#d4af37] hover:bg-[#2a2a2c] rounded-lg text-xs font-bold transition-colors cursor-pointer">
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <label htmlFor="admin-products-category-filter" className="text-xs text-[#99907c]">Category:</label>
          <select
            id="admin-products-category-filter"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-xs bg-[#0e0e10] border border-[#353437] text-[#e5e1e4] rounded-lg p-2 focus:outline-hidden focus:border-[#d4af37]"
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
      <div className="bg-[#1c1b1d] rounded-3xl border border-[#353437] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#201f22] text-[#99907c] uppercase text-[10px] tracking-wider border-b border-[#353437] font-sans">
              <tr>
                <th className="p-4">Product Info</th>
                <th className="p-4">Category</th>
                <th className="p-4">Variants & Pricing</th>
                <th className="p-4">Total Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#353437]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[#99907c]">Loading catalog...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[#99907c]">No products found.</td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const totalStock = prod.variants.reduce((sum, v) => sum + v.stock, 0);
                  return (
                    <tr key={prod._id || prod.id} className="hover:bg-[#201f22]/60 transition-colors">
                      
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.images[0]}
                            alt={prod.name}
                            className="w-12 h-12 object-cover rounded-xl bg-[#0e0e10] shrink-0 border border-[#353437]"
                          />
                          <div>
                            <span className="font-bold text-[#e5e1e4] text-xs line-clamp-1 block">
                              {prod.name}
                            </span>
                            <span className="text-[10px] text-[#99907c]">
                              Slug: {prod.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 capitalize text-[#d0c5af] font-medium">
                        {prod.category.replace('_', ' ')}
                      </td>

                      <td className="p-4">
                        <div className="space-y-1">
                          {prod.variants.map((v) => (
                            <div key={v.id} className="text-[11px] flex items-center gap-2">
                              <span className="font-semibold text-[#d0c5af]">{v.packSize}:</span>
                              <span className="text-[#f2ca50] font-bold">{formatINR(v.pricePaise)}</span>
                              <span className="text-[#99907c] font-mono text-[10px]">({v.sku})</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          totalStock <= 15 ? 'bg-[#a94f38]/20 text-[#e07a5f] border border-[#a94f38]/30' : 'bg-[#435b43]/20 text-[#8b9b7b] border border-[#435b43]/30'
                        }`}>
                          {totalStock} units
                        </span>
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => handleTogglePublish(prod)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 cursor-pointer ${
                            prod.isPublished ? 'bg-[#435b43]/20 text-[#8b9b7b] border border-[#435b43]/30' : 'bg-[#201f22] text-[#99907c] border border-[#353437]'
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
                            className="p-1.5 text-[#99907c] hover:text-[#d4af37] hover:bg-[#201f22] rounded-lg transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            className="p-1.5 text-[#99907c] hover:text-[#e07a5f] hover:bg-[#201f22] rounded-lg transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c1b1d] w-full max-w-2xl rounded-3xl border border-[#353437] shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-[#353437]">
              <h2 className="font-editorial text-xl font-bold text-[#e5e1e4]">
                {editingProduct.id ? 'Edit Product' : 'Add New Western Ghats Harvest'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#99907c] hover:text-[#e5e1e4] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label htmlFor="prod-name-input" className="block text-xs font-semibold text-[#d0c5af] mb-1">Product Title *</label>
                <input
                  id="prod-name-input"
                  name="productName"
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="e.g. Malabar Tellicherry Black Pepper"
                  className="w-full text-xs p-2.5 bg-[#0e0e10] border border-[#353437] rounded-xl text-[#e5e1e4] placeholder-[#99907c] focus:outline-hidden focus:border-[#d4af37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prod-category-select" className="block text-xs font-semibold text-[#d0c5af] mb-1">Category *</label>
                  <select
                    id="prod-category-select"
                    name="category"
                    value={editingProduct.category || 'spices'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as any })}
                    className="w-full text-xs p-2.5 bg-[#0e0e10] border border-[#353437] rounded-xl text-[#e5e1e4] focus:outline-hidden focus:border-[#d4af37]"
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
                  <label htmlFor="prod-origin-input" className="block text-xs font-semibold text-[#d0c5af] mb-1">Origin Location</label>
                  <input
                    id="prod-origin-input"
                    name="origin"
                    type="text"
                    value={editingProduct.origin || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, origin: e.target.value })}
                    placeholder="e.g. Idukki, Munnar, Kerala"
                    className="w-full text-xs p-2.5 bg-[#0e0e10] border border-[#353437] rounded-xl text-[#e5e1e4] placeholder-[#99907c] focus:outline-hidden focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="prod-short-desc-input" className="block text-xs font-semibold text-[#d0c5af] mb-1">Short Description</label>
                <input
                  id="prod-short-desc-input"
                  name="shortDescription"
                  type="text"
                  value={editingProduct.shortDescription || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })}
                  placeholder="One sentence summary for catalog cards"
                  className="w-full text-xs p-2.5 bg-[#0e0e10] border border-[#353437] rounded-xl text-[#e5e1e4] placeholder-[#99907c] focus:outline-hidden focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label htmlFor="prod-full-desc-input" className="block text-xs font-semibold text-[#d0c5af] mb-1">Full Detailed Story & Description</label>
                <textarea
                  id="prod-full-desc-input"
                  name="description"
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full text-xs p-2.5 bg-[#0e0e10] border border-[#353437] rounded-xl text-[#e5e1e4] placeholder-[#99907c] focus:outline-hidden focus:border-[#d4af37]"
                />
              </div>

              {/* DIRECT PRODUCT IMAGE LINK / URL FIELD */}
              <div className="bg-[#201f22] p-4 rounded-2xl border border-[#353437] space-y-3">
                <div className="flex justify-between items-center">
                  <label htmlFor="prod-image-url-input" className="block text-xs font-bold text-[#e5e1e4]">
                    Product Image Link / Product URL *
                  </label>
                  <span className="text-[10px] text-[#99907c]">Supports direct web URLs & asset links</span>
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
                      className="w-full text-xs p-2.5 bg-[#0e0e10] border border-[#353437] rounded-xl font-mono text-[#e5e1e4] placeholder-[#99907c] focus:outline-hidden focus:border-[#d4af37]"
                    />
                  </div>

                  {/* Live Image Preview Thumbnail */}
                  <div className="w-14 h-14 rounded-xl border border-[#353437] bg-[#0e0e10] overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
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
                      <span className="text-[9px] text-[#99907c] font-bold uppercase text-center px-1">No Image</span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-[#99907c]">
                  Enter a direct web URL of the product picture. This URL is saved directly to the product database for instant rendering across the storefront.
                </p>
              </div>

              {/* Variants Section */}
              <div className="pt-3 border-t border-[#353437] space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#e5e1e4] font-sans">
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
                    className="text-xs font-bold text-[#d4af37] hover:text-[#f2ca50] cursor-pointer"
                  >
                    + Add Pack Variant
                  </button>
                </div>

                {editingProduct.variants?.map((v, vIdx) => (
                  <div key={v.id || vIdx} className="grid grid-cols-5 gap-2 bg-[#201f22] p-3 rounded-xl items-center text-xs border border-[#353437]">
                    <div>
                      <label htmlFor={`variant-packsize-${vIdx}`} className="text-[10px] text-[#99907c] block">Pack Size</label>
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
                        className="w-full p-1.5 bg-[#0e0e10] border border-[#353437] rounded text-xs text-[#e5e1e4]"
                      />
                    </div>

                    <div>
                      <label htmlFor={`variant-price-${vIdx}`} className="text-[10px] text-[#99907c] block">Price (INR ₹)</label>
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
                        className="w-full p-1.5 bg-[#0e0e10] border border-[#353437] rounded text-xs font-bold text-[#f2ca50]"
                      />
                    </div>

                    <div>
                      <label htmlFor={`variant-stock-${vIdx}`} className="text-[10px] text-[#99907c] block">Stock Units</label>
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
                        className="w-full p-1.5 bg-[#0e0e10] border border-[#353437] rounded text-xs text-[#e5e1e4]"
                      />
                    </div>

                    <div>
                      <label htmlFor={`variant-sku-${vIdx}`} className="text-[10px] text-[#99907c] block">SKU</label>
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
                        className="w-full p-1.5 bg-[#0e0e10] border border-[#353437] rounded text-xs text-[#e5e1e4]"
                      />
                    </div>

                    <div className="text-right pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          const vars = (editingProduct.variants || []).filter((_, i) => i !== vIdx);
                          setEditingProduct({ ...editingProduct, variants: vars });
                        }}
                        className="text-[#e07a5f] hover:underline text-xs cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Toggles */}
              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#d0c5af] cursor-pointer">
                  <input
                    id="prod-is-published"
                    name="isPublished"
                    type="checkbox"
                    checked={editingProduct.isPublished}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isPublished: e.target.checked })}
                    className="rounded accent-[#d4af37]"
                  />
                  <span>Published on Storefront</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-[#d0c5af] cursor-pointer">
                  <input
                    id="prod-is-featured"
                    name="isFeatured"
                    type="checkbox"
                    checked={editingProduct.isFeatured}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })}
                    className="rounded accent-[#d4af37]"
                  />
                  <span>Featured Estate Reserve</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#353437]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 text-xs font-semibold text-[#99907c] hover:text-[#e5e1e4] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#d4af37] text-[#131315] hover:bg-[#f2ca50] text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer"
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
