import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeSchema, queryAll, queryOne } from './db.js';
import { seedDatabase } from './seed.js';

const app = express();
const port = process.env.PORT || 5000;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '..', 'dist');

app.use(cors({ origin: clientOrigin === '*' ? true : clientOrigin }));
app.use(express.json());

initializeSchema();
seedDatabase();

function mapPlan(row) {
  return {
    id: row.id,
    tenureMonths: row.tenure_months,
    monthlyPayment: row.monthly_payment,
    interestRate: row.interest_rate,
    cashback: row.cashback,
    partnerFund: row.partner_fund,
    isPopular: Boolean(row.is_popular)
  };
}

function mapVariant(row) {
  return {
    id: row.id,
    sku: row.sku,
    storage: row.storage,
    colorName: row.color_name,
    colorHex: row.color_hex,
    finish: row.finish,
    mrp: row.mrp,
    price: row.price,
    imageUrl: row.image_url,
    plans: []
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: 'sqlite' });
});

app.get('/api/products', (_req, res) => {
  const products = queryAll(`
    SELECT p.id, p.slug, p.name, p.brand, p.category, p.badge, p.description, p.image_url,
           COUNT(v.id) AS variant_count, MIN(v.price) AS starting_price
    FROM products p
    LEFT JOIN variants v ON v.product_id = p.id
    GROUP BY p.id
    ORDER BY p.id
  `);

  res.json({
    products: products.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      category: product.category,
      badge: product.badge,
      description: product.description,
      imageUrl: product.image_url,
      variantCount: product.variant_count,
      startingPrice: product.starting_price
    }))
  });
});

app.get('/api/products/:slug', (req, res) => {
  const product = queryOne('SELECT * FROM products WHERE slug = :slug', { slug: req.params.slug });

  if (!product) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  const variants = queryAll('SELECT * FROM variants WHERE product_id = :productId ORDER BY id', {
    productId: product.id
  }).map(mapVariant);

  const plans = queryAll(`
    SELECT ep.*, v.sku
    FROM emi_plans ep
    JOIN variants v ON v.id = ep.variant_id
    WHERE v.product_id = :productId
    ORDER BY ep.tenure_months
  `, { productId: product.id });

  const variantsById = new Map(variants.map((variant) => [variant.id, variant]));
  for (const plan of plans) {
    const variant = variantsById.get(plan.variant_id);
    if (variant) variant.plans.push(mapPlan(plan));
  }

  res.json({
    product: {
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      category: product.category,
      badge: product.badge,
      description: product.description,
      imageUrl: product.image_url,
      variants
    }
  });
});

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
