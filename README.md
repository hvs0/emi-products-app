# FundBack EMI Store

A simple full-stack product page for smartphones with selectable EMI plans backed by mutual funds. Product details, variants, prices, images, and EMI plans are loaded from a SQLite database through Express APIs and rendered by a React frontend.

## Tech Stack

- Frontend: React, Vite, CSS modules-style plain CSS
- Backend: Node.js, Express
- Database: SQLite using Node's built-in `node:sqlite`
- Deployment target: Vercel free tier for frontend, Render free tier for backend

## Local Setup

```bash
npm install
npm run seed
npm run dev
```

Open:

```text
http://localhost:5173/products/iphone-17-pro
```

The API runs on:

```text
http://localhost:5000
```

## Environment Variables

For local development, copy `.env.example` values into your shell or deployment dashboard as needed.

Frontend on Vercel:

```text
VITE_API_BASE_URL=https://your-render-service.onrender.com
```

Backend on Render:

```text
CLIENT_ORIGIN=https://your-vercel-project.vercel.app
DATABASE_PATH=/opt/render/project/src/server/data/catalog.sqlite
```

For quick testing, `CLIENT_ORIGIN=*` is acceptable on the backend. For submission, set it to your Vercel URL.

## API Endpoints

### Health Check

```http
GET /api/health
```

Example response:

```json
{
  "status": "ok",
  "database": "sqlite"
}
```

### Product List

```http
GET /api/products
```

Example response:

```json
{
  "products": [
    {
      "id": 1,
      "slug": "iphone-17-pro",
      "name": "iPhone 17 Pro",
      "brand": "Apple",
      "category": "Smartphones",
      "badge": "NEW",
      "description": "Flagship performance phone with a bright Pro display, premium finish, and EMI plans backed by eligible mutual fund holdings.",
      "imageUrl": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=85",
      "variantCount": 2,
      "startingPrice": 127400
    }
  ]
}
```

### Product Detail

```http
GET /api/products/:slug
```

Example:

```http
GET /api/products/iphone-17-pro
```

Example response:

```json
{
  "product": {
    "id": 1,
    "slug": "iphone-17-pro",
    "name": "iPhone 17 Pro",
    "brand": "Apple",
    "category": "Smartphones",
    "badge": "NEW",
    "description": "Flagship performance phone with a bright Pro display, premium finish, and EMI plans backed by eligible mutual fund holdings.",
    "imageUrl": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=85",
    "variants": [
      {
        "id": 1,
        "sku": "IPH17P-SIL-256",
        "storage": "256GB",
        "colorName": "Silver",
        "colorHex": "#d8d8d2",
        "finish": "Silver",
        "mrp": 134900,
        "price": 127400,
        "imageUrl": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=85",
        "plans": [
          {
            "id": 1,
            "tenureMonths": 3,
            "monthlyPayment": 44967,
            "interestRate": 0,
            "cashback": 7500,
            "partnerFund": "Balanced Advantage Fund",
            "isPopular": true
          }
        ]
      }
    ]
  }
}
```

## Database Schema

The SQL schema is in `server/data/schema.sql`.

```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  badge TEXT,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL
);

CREATE TABLE variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  storage TEXT NOT NULL,
  color_name TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  finish TEXT NOT NULL,
  mrp INTEGER NOT NULL,
  price INTEGER NOT NULL,
  image_url TEXT,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE emi_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  variant_id INTEGER NOT NULL,
  tenure_months INTEGER NOT NULL,
  monthly_payment INTEGER NOT NULL,
  interest_rate REAL NOT NULL,
  cashback INTEGER DEFAULT 0,
  partner_fund TEXT NOT NULL,
  is_popular INTEGER DEFAULT 0,
  FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE CASCADE
);
```

Seed data is in `server/data/seed.json` and includes:

- `iphone-17-pro`
- `samsung-s24-ultra`
- `oneplus-12`

Each product has at least 2 variants and each variant has multiple EMI plans.

## Free-Tier Deployment

### Backend on Render

1. Push this folder to GitHub.
2. Create a new Render Web Service from the repository.
3. Use the free instance type.
4. Set:

```text
Build Command: npm install
Start Command: npm start
```

5. Add environment variables:

```text
CLIENT_ORIGIN=*
DATABASE_PATH=/opt/render/project/src/server/data/catalog.sqlite
```

6. Copy the Render service URL after deploy.

### Frontend on Vercel

1. Import the same GitHub repository in Vercel.
2. Use the free Hobby plan.
3. Set:

```text
Build Command: npm run build
Output Directory: dist
```

4. Add:

```text
VITE_API_BASE_URL=https://your-render-service.onrender.com
```

5. Deploy and open:

```text
https://your-vercel-project.vercel.app/products/iphone-17-pro
```

After Vercel is live, update Render's `CLIENT_ORIGIN` from `*` to the Vercel URL.

## Demo Video Checklist

Record a 2-5 minute screen video showing:

- Product page on desktop and mobile width
- Product switching between the 3 unique product URLs
- Variant selection and EMI plan selection
- API response from `/api/products` and `/api/products/iphone-17-pro`
- Database schema and seed file
- Deployed Vercel frontend and Render backend URLs

Upload the video to Google Drive or YouTube and set sharing to anyone with the link can view.
