import { db } from '../models/dataStore.js';
export async function getMyOrders(req, res) {
    try {
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }
        const orders = db.findOrdersByUser(userId);
        return res.json({
            success: true,
            data: orders
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to retrieve orders', error: err.message });
    }
}
export async function getOrderById(req, res) {
    try {
        const { id } = req.params;
        const order = db.findOrderById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }
        // Ownership check: must be the customer who placed it or an admin
        const userId = req.user?.id || req.user?._id;
        const isAdmin = req.user?.role === 'admin';
        if (order.userId && order.userId !== userId && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Unauthorized to view this order.' });
        }
        return res.json({
            success: true,
            data: order
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to retrieve order details', error: err.message });
    }
}
export async function trackGuestOrder(req, res) {
    try {
        const { orderNumber, emailOrPhone } = req.body;
        if (!orderNumber || !emailOrPhone) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both your Order Number (e.g. SR-2026-XXXXX) and the Email or Phone used during checkout.'
            });
        }
        const order = db.findOrderByGuest(orderNumber, emailOrPhone);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'No matching order found. Please verify your order number and contact details.'
            });
        }
        return res.json({
            success: true,
            data: order
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to track order', error: err.message });
    }
}
export async function cancelOrder(req, res) {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user?.id || req.user?._id;
        const isAdmin = req.user?.role === 'admin';
        const order = db.findOrderById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }
        if (order.userId && order.userId !== userId && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Unauthorized to cancel this order.' });
        }
        // Cancellation rule: only pending or confirmed orders before processing/dispatch can be cancelled
        if (order.fulfillmentStatus === 'shipped' || order.fulfillmentStatus === 'delivered') {
            return res.status(400).json({
                success: false,
                message: 'This order has already been dispatched and cannot be cancelled directly. Please contact customer care for returns.'
            });
        }
        if (order.fulfillmentStatus === 'cancelled') {
            return res.status(400).json({ success: false, message: 'This order is already cancelled.' });
        }
        // Restore stock
        for (const snap of order.items) {
            const prod = db.findProductById(snap.productId);
            if (prod) {
                const vIndex = prod.variants.findIndex(v => v.id === snap.variantId);
                if (vIndex >= 0) {
                    prod.variants[vIndex].stock += snap.quantity;
                    prod.variants[vIndex].isAvailable = true;
                    db.updateProduct(prod.id || '', { variants: prod.variants });
                }
            }
        }
        const updated = db.updateOrder(order.id || '', {
            fulfillmentStatus: 'cancelled',
            statusHistory: [
                ...order.statusHistory,
                {
                    status: 'cancelled',
                    timestamp: new Date().toISOString(),
                    note: `Cancelled by customer. Reason: ${reason || 'Customer request'}`
                }
            ]
        });
        return res.json({
            success: true,
            message: 'Order cancelled successfully. Stock has been restored.',
            data: updated
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to cancel order', error: err.message });
    }
}
