import { db } from '../models/dataStore.js';
function getCartIdentifier(req) {
    const userId = req.user?.id || req.user?._id;
    const guestId = req.headers['x-guest-id'] || req.query.guestId || req.body?.guestId;
    return { userId, guestId };
}
function hydrateCartItems(items) {
    const hydrated = [];
    let subtotalPaise = 0;
    for (const item of items) {
        const product = db.findProductById(item.productId);
        if (!product || !product.isPublished)
            continue;
        const variant = product.variants.find(v => v.id === item.variantId);
        if (!variant)
            continue;
        // Actual price and stock from database
        const unitPricePaise = variant.pricePaise;
        const maxQuantity = Math.min(item.quantity, variant.stock);
        const quantity = Math.max(1, maxQuantity);
        const lineTotalPaise = unitPricePaise * quantity;
        subtotalPaise += lineTotalPaise;
        hydrated.push({
            productId: product.id || '',
            productName: product.name,
            productSlug: product.slug,
            image: product.images[0] || '',
            variantId: variant.id,
            packSize: variant.packSize,
            unitPricePaise,
            comparePricePaise: variant.comparePricePaise,
            quantity,
            maxStock: variant.stock,
            lineTotalPaise
        });
    }
    const settings = db.getSettings();
    const freeShippingThresholdPaise = settings.freeShippingThresholdPaise;
    const qualifiesForFreeShipping = subtotalPaise >= freeShippingThresholdPaise;
    const freeShippingRemainingPaise = Math.max(0, freeShippingThresholdPaise - subtotalPaise);
    return {
        items: hydrated,
        subtotalPaise,
        qualifiesForFreeShipping,
        freeShippingThresholdPaise,
        freeShippingRemainingPaise
    };
}
export async function getCart(req, res) {
    try {
        const identifier = getCartIdentifier(req);
        const cart = db.getCart(identifier);
        if (!cart || !cart.items || cart.items.length === 0) {
            return res.json({
                success: true,
                data: {
                    items: [],
                    subtotalPaise: 0,
                    qualifiesForFreeShipping: false,
                    freeShippingThresholdPaise: db.getSettings().freeShippingThresholdPaise,
                    freeShippingRemainingPaise: db.getSettings().freeShippingThresholdPaise
                }
            });
        }
        const calculated = hydrateCartItems(cart.items);
        return res.json({
            success: true,
            data: calculated
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to retrieve cart', error: err.message });
    }
}
export async function addToCart(req, res) {
    try {
        const identifier = getCartIdentifier(req);
        const { productId, variantId, quantity = 1 } = req.body;
        if (!productId || !variantId) {
            return res.status(400).json({ success: false, message: 'Product ID and Variant ID are required.' });
        }
        const product = db.findProductById(productId);
        if (!product || !product.isPublished) {
            return res.status(404).json({ success: false, message: 'Product is not available.' });
        }
        const variant = product.variants.find(v => v.id === variantId);
        if (!variant) {
            return res.status(404).json({ success: false, message: 'Product variant not found.' });
        }
        if (variant.stock <= 0 || !variant.isAvailable) {
            return res.status(400).json({ success: false, message: 'Selected variant is currently out of stock.' });
        }
        const cart = db.getCart(identifier) || {
            userId: identifier.userId,
            guestId: identifier.guestId,
            items: [],
            updatedAt: new Date().toISOString()
        };
        const existingIndex = cart.items.findIndex(i => i.productId === productId && i.variantId === variantId);
        if (existingIndex >= 0) {
            const newQty = cart.items[existingIndex].quantity + Number(quantity);
            if (newQty > variant.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${variant.stock} units are currently available for ${variant.packSize}.`
                });
            }
            cart.items[existingIndex].quantity = newQty;
        }
        else {
            const addQty = Math.min(Number(quantity), variant.stock);
            cart.items.push({
                productId,
                variantId,
                packSize: variant.packSize,
                quantity: addQty,
                unitPricePaise: variant.pricePaise
            });
        }
        db.saveCart(cart);
        const calculated = hydrateCartItems(cart.items);
        return res.json({
            success: true,
            message: `${product.name} (${variant.packSize}) added to cart.`,
            data: calculated
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to add item to cart', error: err.message });
    }
}
export async function updateCartItem(req, res) {
    try {
        const identifier = getCartIdentifier(req);
        const { productId, variantId, quantity } = req.body;
        const cart = db.getCart(identifier);
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found.' });
        }
        const itemIndex = cart.items.findIndex(i => i.productId === productId && i.variantId === variantId);
        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: 'Item not found in cart.' });
        }
        const numQty = Number(quantity);
        if (numQty <= 0) {
            cart.items.splice(itemIndex, 1);
        }
        else {
            const product = db.findProductById(productId);
            const variant = product?.variants.find(v => v.id === variantId);
            if (variant && numQty > variant.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${variant.stock} units available for this variant.`
                });
            }
            cart.items[itemIndex].quantity = numQty;
        }
        db.saveCart(cart);
        const calculated = hydrateCartItems(cart.items);
        return res.json({
            success: true,
            data: calculated
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to update cart item', error: err.message });
    }
}
export async function removeCartItem(req, res) {
    try {
        const identifier = getCartIdentifier(req);
        const { productId, variantId } = req.body;
        const cart = db.getCart(identifier);
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found.' });
        }
        cart.items = cart.items.filter(i => !(i.productId === productId && i.variantId === variantId));
        db.saveCart(cart);
        const calculated = hydrateCartItems(cart.items);
        return res.json({
            success: true,
            message: 'Item removed from cart.',
            data: calculated
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to remove item', error: err.message });
    }
}
export async function clearCart(req, res) {
    try {
        const identifier = getCartIdentifier(req);
        db.clearCart(identifier);
        return res.json({ success: true, message: 'Cart cleared.' });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to clear cart', error: err.message });
    }
}
