import { db } from '../models/dataStore.js';
export async function getProducts(req, res) {
    try {
        const { category, search, minPrice, maxPrice, sort, inStock, featured, page = '1', limit = '12' } = req.query;
        let products = db.getProducts().filter(p => p.isPublished);
        // Category filter
        if (category && category !== 'all') {
            products = products.filter(p => p.category.toLowerCase() === String(category).toLowerCase());
        }
        // Featured filter
        if (featured === 'true') {
            products = products.filter(p => p.isFeatured);
        }
        // Search query
        if (search) {
            const q = String(search).toLowerCase().trim();
            products = products.filter(p => p.name.toLowerCase().includes(q) ||
                p.shortDescription.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.tags?.some(t => t.toLowerCase().includes(q)) ||
                p.ingredients?.some(i => i.toLowerCase().includes(q)));
        }
        // In Stock filter
        if (inStock === 'true') {
            products = products.filter(p => p.variants.some(v => v.stock > 0 && v.isAvailable));
        }
        // Price range (in INR converted to paise)
        if (minPrice) {
            const minPaise = Number(minPrice) * 100;
            products = products.filter(p => p.variants.some(v => v.pricePaise >= minPaise));
        }
        if (maxPrice) {
            const maxPaise = Number(maxPrice) * 100;
            products = products.filter(p => p.variants.some(v => v.pricePaise <= maxPaise));
        }
        // Sorting
        switch (sort) {
            case 'price_asc':
                products.sort((a, b) => (a.variants[0]?.pricePaise || 0) - (b.variants[0]?.pricePaise || 0));
                break;
            case 'price_desc':
                products.sort((a, b) => (b.variants[0]?.pricePaise || 0) - (a.variants[0]?.pricePaise || 0));
                break;
            case 'rating':
                products.sort((a, b) => b.rating - a.rating);
                break;
            case 'newest':
                products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            case 'name_asc':
                products.sort((a, b) => a.name.localeCompare(b.name));
                break;
            default:
                // Featured first, then rating
                products.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
                break;
        }
        // Pagination
        const pageNum = Math.max(1, parseInt(String(page), 10));
        const pageSize = Math.max(1, parseInt(String(limit), 10));
        const totalItems = products.length;
        const totalPages = Math.ceil(totalItems / pageSize);
        const paginatedProducts = products.slice((pageNum - 1) * pageSize, pageNum * pageSize);
        return res.json({
            success: true,
            data: {
                products: paginatedProducts,
                pagination: {
                    page: pageNum,
                    limit: pageSize,
                    totalItems,
                    totalPages,
                    hasNextPage: pageNum < totalPages,
                    hasPrevPage: pageNum > 1
                }
            }
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to retrieve products', error: err.message });
    }
}
export async function getProductBySlug(req, res) {
    try {
        const { slug } = req.params;
        const product = db.findProductBySlug(slug) || db.findProductById(slug);
        if (!product || !product.isPublished) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }
        // Related products in the same category
        const related = db.getProducts()
            .filter(p => p.id !== product.id && p.category === product.category && p.isPublished)
            .slice(0, 4);
        // Reviews for this product
        const reviews = db.getReviews(product.id);
        return res.json({
            success: true,
            data: {
                product,
                related,
                reviews
            }
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to retrieve product details', error: err.message });
    }
}
export async function getCategories(_req, res) {
    try {
        const categories = db.getCategories();
        const products = db.getProducts().filter(p => p.isPublished);
        const categoriesWithCount = categories.map(cat => ({
            ...cat,
            itemCount: products.filter(p => p.category.toLowerCase() === cat.slug.toLowerCase()).length
        }));
        return res.json({
            success: true,
            data: categoriesWithCount
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to retrieve categories', error: err.message });
    }
}
export async function addProductReview(req, res) {
    try {
        const { id } = req.params;
        const { customerName, rating, comment } = req.body;
        if (!customerName || !rating || !comment) {
            return res.status(400).json({ success: false, message: 'Please provide name, rating (1-5), and review text.' });
        }
        const product = db.findProductById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }
        const numRating = Math.min(5, Math.max(1, Number(rating)));
        const review = db.createReview({
            productId: product.id || id,
            customerName: customerName.trim(),
            rating: numRating,
            comment: comment.trim(),
            isVerifiedPurchase: true,
            createdAt: new Date().toISOString()
        });
        // Update product rating average
        const allReviews = db.getReviews(product.id);
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        db.updateProduct(product.id || id, {
            rating: Number(avgRating.toFixed(1)),
            reviewCount: allReviews.length
        });
        return res.status(201).json({ success: true, data: review, message: 'Thank you! Your review has been published.' });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to submit review', error: err.message });
    }
}
