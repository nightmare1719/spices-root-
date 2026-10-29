# 🚀 Live Deployment Guide: Render (Backend) + Vercel (Frontend)

This guide provides the exact configuration and step-by-step instructions to publish your **Spice Roots / Kalaivani E-Commerce** platform live.

---

## 📋 Architecture Overview

| Component | Platform | Root Directory | Build Command | Output / Start Command |
| :--- | :--- | :--- | :--- | :--- |
| **Backend API** | **Render** | `server` | `npm install && npm run build` | `npm start` |
| **Frontend UI** | **Vercel** | `client` | `npm run build` | `dist` |

---

## Part 1: Push Code to GitHub

Make sure your latest code and newly added deployment configuration files are pushed to GitHub:

```bash
git add .
git commit -m "Configure project for Render backend and Vercel frontend live deployment"
git push origin main
```

---

## Part 2: Deploy Backend on Render

### Step 1: Create Web Service
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository (`kalaivani online shopping` / your repo).
4. Configure the settings:
   - **Name**: `spice-roots-backend` (or your preferred name)
   - **Region**: Closest to your users (e.g., *Singapore* for India)
   - **Branch**: `main`
   - **Root Directory**: `server` ⚠️ *(Very Important!)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### Step 2: Advanced Settings (Health Check)
- Expand **Advanced**.
- Under **Health Check Path**, enter: `/api/health`

### Step 3: Add Environment Variables on Render
Under the **Environment Variables** section, add the following keys:

| Key | Value / Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | `production` |
| `PORT` | `5000` *(Render sets this dynamically, but setting 5000 is good practice)* | `5000` |
| `CLIENT_URL` | Your Vercel frontend URL *(Leave blank or use temporary localhost until Vercel is deployed, then update)* | `https://your-frontend.vercel.app` |
| `MONGODB_URI` | Your MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `JWT_SECRET` | Strong secret string for tokens | `generate a long random string` |
| `RAZORPAY_KEY_ID` | Razorpay API Key ID | `rzp_live_...` or test key |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | `your_secret` |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Webhook Secret *(optional)* | `your_webhook_secret` |
| `GEMINI_API_KEY` | Google Gemini AI Key *(optional)* | `AIzaSy...` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID *(optional)* | `...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret *(optional)* | `GOCSPX-...` |
| `STORE_NAME` | Store Name | `Spice Roots` |
| `STORE_EMAIL` | Store Email | `care@spiceroots.in` |
| `STORE_PHONE` | Customer Care Phone | `+91 91885 70191` |
| `MERCHANT_UPI_ID` | Merchant UPI ID for QR payments | `cynalbertoz@sbi` |
| `MERCHANT_NAME` | Merchant Display Name | `Spice Roots` |
| `MERCHANT_WHATSAPP_NUMBER`| WhatsApp number for payment receipts | `919188570191` |

> [!IMPORTANT]
> **MongoDB Atlas Network Access**:
> Go to **MongoDB Atlas** > **Network Access** > Click **Add IP Address** > Choose **Allow Access from Anywhere (`0.0.0.0/0`)**.
> Since Render uses dynamic outbound IPs, failing to whitelist `0.0.0.0/0` will cause Atlas to block Render.

### Step 4: Deploy & Copy URL
1. Click **Create Web Service**.
2. Wait for the build and seed process to complete.
3. Once live, your Render URL is:  
   👉 `https://spices-root.onrender.com`

---

## Part 3: Deploy Frontend on Vercel

### Step 1: Import Project into Vercel
1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** > **Project**.
3. Import your GitHub repository.

### Step 2: Configure Project & Root Directory
In the **Configure Project** screen:
- **Project Name**: `spice-roots` (or your choice)
- **Framework Preset**: `Vite`
- **Root Directory**: Click **Edit** and select **`client`** ⚠️ *(Crucial!)*

### Step 3: Build & Output Settings
Verify these settings (Vercel automatically detects them with Root Directory = `client`):
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 4: Environment Variables on Vercel
Expand **Environment Variables** and add:

| Key | Value |
| :--- | :--- |
| `VITE_API_BASE_URL` | `https://spices-root.onrender.com/api` |
| `VITE_GOOGLE_CLIENT_ID` | Your Google OAuth Client ID *(Optional)* |

### Step 5: Deploy
1. Click **Deploy**.
2. Vercel will install dependencies and run `tsc -b && vite build`.
3. Thanks to `client/vercel.json`, all routes (e.g. `/shop`, `/cart`, `/admin`) will support direct page refreshes without 404 errors.
4. Copy your live Vercel URL:  
   👉 `https://spice-roots.vercel.app`

---

## Part 4: Final Link (CORS & Webhooks)

1. Return to **Render** > Your `spices-root` Web Service > **Environment**.
2. Update the `CLIENT_URL` variable to your actual live Vercel frontend URL:
   ```env
   CLIENT_URL=https://spice-roots.vercel.app
   ```
3. Click **Save Changes** (Render will redeploy with CORS active for your Vercel domain).
4. *(Optional)* If using Google Login, add your Vercel URL `https://spice-roots.vercel.app` to **Authorized JavaScript origins** in Google Cloud Console.
5. *(Optional)* If using Razorpay Webhooks, set your Webhook URL in the Razorpay dashboard to:
   ```
   https://spices-root.onrender.com/api/checkout/razorpay-webhook
   ```
