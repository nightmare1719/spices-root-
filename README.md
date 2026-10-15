# 🌿 SPICE ROOTS — Premium Kerala & Western Ghats Spice E-Commerce

A full-stack, production-grade luxury e-commerce platform and AI Shopping Assistant designed for authentic Indian spices, single-estate Munnar teas, artisanal masala blends, essential oils, and handcrafted gift hampers, inspired by the natural richness of Kerala and the Western Ghats.

---

## ✨ Features & Architecture

### 🛍️ Customer Experience
- **Editorial Brand Design**: Warm cream and ivory backgrounds, deep forest green brand palette (`#153E2B`), muted gold accents (`#C5A059`), and refined typography powered by *Playfair Display* and *Plus Jakarta Sans*.
- **Dynamic Variant & Weight Selection**: Supports variants (50g, 100g, 250g, 500g, 1kg) with live stock checking, compare price strike-throughs, and instant paise-accurate price calculations.
- **Server-Side Price & Stock Verification**: Order totals, item prices, shipping charges, GST, and discounts are strictly calculated and recalculated on the backend to prevent client-side tampering.
- **Promotional Coupon System**: Live coupon code validation (`WELCOME10`, `KERALA20`, `FREESHIP`) enforcing minimum order limits and expiry dates.
- **Free Shipping Progress Tracker**: Real-time progress bar alerting customers how many more rupees to add for free pan-India express delivery (configurable, default ₹999).
- **Payment Verification via Razorpay**: Full support for Indian online payments (UPI, GPay, PhonePe, Cards, NetBanking) with HMAC SHA256 signature verification and developer sandbox simulation mode. Cash on Delivery (COD) is supported as an optional toggle.
- **Order Tracking & Confirmation**: Unique order numbers (`SR-2026-XXXXX`), status timeline (`Confirmed` → `Processing at Depot` → `Dispatched with Courier` → `Delivered`), and secure guest tracking using Order ID + Phone/Email.
- **Wishlist & Cart Persistence**: Persistent guest and authenticated customer carts and wishlists across sessions.

### 🤖 AI-Powered Spice Shopping Assistant
- **Floating Interactive Concierge**: Positioned unobtrusively in the bottom-right corner.
- **Catalog-Grounded Recommendations**: Powered by server-side Google Gemini 1.5 (`@google/generative-ai`), with an automated, intelligent fallback catalog matcher when API keys are not present.
- **Interactive Product Cards in Chat**: Allows customers to view product details and directly add recommended harvests to their cart from inside the chat window.
- **Quick Prompts**: "Find spices for biryani", "Which pepper should I buy?", "Recommend an evening tea", "Show products under ₹500", "How do I store whole spices?".

### 🛡️ Protected Admin Dashboard (`/admin`)
- **Role-Based Server Authorization**: Admin routes protected by server-side JWT verification and `role === 'admin'` checks.
- **Overview & Logistics Metrics**: Real-time sales in ₹, total orders, pending dispatches, low stock warnings, recent orders table, and bestselling harvests.
- **Product & Inventory Management**: Complete CRUD for products and variants, stock level adjustment, publish/hide toggles, and CSV export.
- **Order Management**: Search orders, review customer delivery addresses, update fulfillment status, assign courier names (Blue Dart, DTDC, India Post), add tracking numbers, and view audit history.
- **Coupon Management**: Create, edit, and toggle discount codes with percentage/flat discounts and minimum cart thresholds.
- **Store Settings**: Real-time configuration for brand name, phone, email, depot address, free-shipping threshold, shipping fee, tax rate, and store policies.

---

## 📁 Project Directory Structure

```
c:\kalaivani online shopping\
├── client/                      # React 19 + TypeScript + Vite + Tailwind CSS v4
│   ├── public/
│   │   ├── images/              # Authentic logo & hero banner assets
│   │   ├── robots.txt           # Search crawler directives
│   │   └── sitemap.xml          # SEO sitemap
│   ├── src/
│   │   ├── components/          # Reusable components (Header, Footer, ProductCard, MiniCart, AIAssistant)
│   │   ├── context/             # AuthContext, CartContext, WishlistContext, StoreContext
│   │   ├── pages/               # Home, Shop, Category, ProductDetail, Cart, Checkout, OrderConfirmation, Profile
│   │   │   └── admin/           # Protected Admin Dashboard, Products, Orders, Coupons, Customers, Settings
│   │   ├── services/            # API Client with token and guest tracking
│   │   ├── types/               # TypeScript interfaces
│   │   ├── utils/               # Currency formatting (₹ paise to INR), dates
│   │   ├── App.tsx              # React router routing tree
│   │   ├── index.css            # Luxury Design System & custom tokens
│   │   └── main.tsx             # React entrypoint
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts           # Proxy to backend on port 5000
│
├── server/                      # Node.js + Express REST API
│   ├── data/                    # store.json (Built-in persistent DataStore engine)
│   ├── src/
│   │   ├── config/              # Database connection (MongoDB Atlas + DataStore fallback)
│   │   ├── controllers/         # Products, Cart, Checkout, Orders, Auth, Admin, Coupons, Settings
│   │   ├── middleware/          # JWT auth, Admin role check, Security headers
│   │   ├── models/              # DataStore persistence engine & Mongoose schemas
│   │   ├── routes/              # Express API routers (/api/...)
│   │   ├── services/            # Razorpay service, Gemini AI assistant service
│   │   ├── types/               # Server domain types
│   │   ├── index.ts             # Express server entrypoint
│   │   └── seed.ts              # Idempotent seed script with authentic Kerala catalog
│   ├── tests/                   # Automated Vitest test suite
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example             # Documented environment variables
│
├── package.json                 # Monorepo orchestration scripts
└── README.md                    # Documentation
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18 or higher, tested on v20.19.0)
- npm (v9 or higher, tested on 10.8.2)

### 2. Install All Dependencies
From the repository root:
```bash
npm run install:all
```
*(Or individually run `npm install` in the root, `client/`, and `server/`)*

### 3. Seed Database
Populate the database with authentic Kerala harvests, Western Ghats teas, demo coupons, and administrator credentials:
```bash
npm run seed
```

### 4. Start the Full Application
Launch both the backend API (port 5000) and frontend Vite server (port 5173) concurrently:
```bash
npm run dev
```

- **Public Storefront**: [http://localhost:5173](http://localhost:5173)
- **Admin Dashboard**: [http://localhost:5173/admin](http://localhost:5173/admin)
- **Backend API Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Demo Accounts & Credentials

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@spiceroots.in` | `AdminPassword123!` |
| **Demo Customer** | `customer@spiceroots.in` | `Customer123!` |

*(On the Login page, click the **"Admin Demo"** or **"Customer Demo"** button to auto-fill credentials instantly!)*

### Available Demo Coupons
- `WELCOME10`: 10% off on carts over ₹499
- `KERALA20`: 20% off on carts over ₹999
- `FREESHIP`: Free shipping discount

---

## ⚙️ Environment Variables

Create a `server/.env` file (copied from `server/.env.example`):

```ini
# Server Port
PORT=5000

# Client Origin (for CORS)
CLIENT_URL=http://localhost:5173

# Database Connection (MongoDB Atlas or Local MongoDB)
# Leave empty or keep default; if MongoDB is not reachable, the built-in persistent DataStore takes over automatically without crashing.
MONGODB_URI=mongodb://localhost:27017/spiceroots

# JWT Authentication Secret
JWT_SECRET=spiceroots_super_secure_jwt_secret_dev_2026_western_ghats_kerala

# Razorpay Credentials (from https://dashboard.razorpay.com/#/app/keys)
RAZORPAY_KEY_ID=rzp_test_YourTestKeyIdHere
RAZORPAY_KEY_SECRET=YourRazorpayTestSecretHere
RAZORPAY_WEBHOOK_SECRET=YourWebhookSecretOptional

# Google Gemini API Key (from https://aistudio.google.com/)
GEMINI_API_KEY=

# Store Configuration Defaults
STORE_NAME=Spice Roots
STORE_EMAIL=care@spiceroots.in
STORE_PHONE=+91 94882 12345
FREE_SHIPPING_THRESHOLD_INR=999
STANDARD_SHIPPING_FEE_INR=60
```

---

## 🧪 Automated Testing & Production Builds

### Run Backend Business Logic Tests
Executes 8 automated tests verifying catalog loading, server-side price quotes, stock depletion, coupon rules, HMAC signature checks, and AI catalog fallback:
```bash
npm test
```

### Production Build
Builds both the frontend bundle (Vite) and backend TypeScript output (`dist/`):
```bash
npm run build
```

---

## 🌐 Production Deployment

### Frontend (Vercel)
1. Set the Root Directory to `client`
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Set Environment Variable: `VITE_API_BASE_URL=https://your-backend-api.onrender.com/api`

### Backend (Render / Railway / DigitalOcean)
1. Set the Root Directory to `server`
2. Build Command: `npm install && npm run build`
3. Start Command: `npm start`
4. Configure Environment Variables (`MONGODB_URI`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `GEMINI_API_KEY`, `CLIENT_URL`)
#   s p i c e s - r o o t -  
 