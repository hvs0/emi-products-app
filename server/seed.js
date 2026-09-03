import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, initializeSchema, queryOne } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, 'data', 'seed.json');
const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

export function seedDatabase({ force = false } = {}) {
  initializeSchema();

  const existing = queryOne('SELECT COUNT(*) AS count FROM products');
  if (!force && existing.count > 0) return { seeded: false, count: existing.count };

  db.exec('DELETE FROM emi_plans; DELETE FROM variants; DELETE FROM products;');

  const insertProduct = db.prepare(`
  INSERT INTO products (slug, name, brand, category, badge, description, image_url)
  VALUES (:slug, :name, :brand, :category, :badge, :description, :imageUrl)
`);

  const insertVariant = db.prepare(`
  INSERT INTO variants (product_id, sku, storage, color_name, color_hex, finish, mrp, price, image_url)
  VALUES (:productId, :sku, :storage, :colorName, :colorHex, :finish, :mrp, :price, :imageUrl)
`);

  const insertPlan = db.prepare(`
  INSERT INTO emi_plans (variant_id, tenure_months, monthly_payment, interest_rate, cashback, partner_fund, is_popular)
  VALUES (:variantId, :tenureMonths, :monthlyPayment, :interestRate, :cashback, :partnerFund, :isPopular)
`);

  db.exec('BEGIN;');
  try {
    for (const product of seedData.products) {
      const productResult = insertProduct.run({
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        category: product.category,
        badge: product.badge,
        description: product.description,
        imageUrl: product.imageUrl
      });
      const productId = Number(productResult.lastInsertRowid);

      for (const variant of product.variants) {
        const variantResult = insertVariant.run({
          productId,
          sku: variant.sku,
          storage: variant.storage,
          colorName: variant.colorName,
          colorHex: variant.colorHex,
          finish: variant.finish,
          mrp: variant.mrp,
          price: variant.price,
          imageUrl: variant.imageUrl
        });
        const variantId = Number(variantResult.lastInsertRowid);

        for (const plan of variant.plans) {
          insertPlan.run({
            variantId,
            tenureMonths: plan.tenureMonths,
            monthlyPayment: plan.monthlyPayment,
            interestRate: plan.interestRate,
            cashback: plan.cashback || 0,
            partnerFund: plan.partnerFund,
            isPopular: plan.isPopular ? 1 : 0
          });
        }
      }
    }
    db.exec('COMMIT;');
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }

  return { seeded: true, count: seedData.products.length };
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const result = seedDatabase({ force: true });
  console.log(`Seeded ${result.count} products into ${process.env.DATABASE_PATH || 'server/data/catalog.sqlite'}`);
}
