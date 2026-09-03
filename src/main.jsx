import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowRight, ChevronDown, ShieldCheck, Smartphone } from 'lucide-react';
import styles from './styles/App.module.css';

const apiBase = import.meta.env.VITE_API_BASE_URL || '';
const cx = (...classes) => classes.filter(Boolean).join(' ');

function formatRupees(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
}

async function fetchJson(path) {
  const response = await fetch(`${apiBase}${path}`);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

function getCurrentSlug(products) {
  const match = window.location.pathname.match(/^\/products\/([^/]+)/);
  return match?.[1] || products[0]?.slug || 'iphone-17-pro';
}

function App() {
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const list = await fetchJson('/api/products');
        if (!active) return;
        setProducts(list.products);
        const slug = getCurrentSlug(list.products);
        const detail = await fetchJson(`/api/products/${slug}`);
        if (!active) return;
        setProduct(detail.product);
        setSelectedVariantId(detail.product.variants[0]?.id || null);
        setSelectedPlanId(detail.product.variants[0]?.plans[0]?.id || null);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    window.addEventListener('popstate', load);

    return () => {
      active = false;
      window.removeEventListener('popstate', load);
    };
  }, []);

  const selectedVariant = useMemo(() => {
    return product?.variants.find((variant) => variant.id === selectedVariantId) || product?.variants[0];
  }, [product, selectedVariantId]);

  const selectedPlan = useMemo(() => {
    return selectedVariant?.plans.find((plan) => plan.id === selectedPlanId) || selectedVariant?.plans[0];
  }, [selectedVariant, selectedPlanId]);

  function openProduct(slug) {
    window.history.pushState({}, '', `/products/${slug}`);
    setLoading(true);
    fetchJson(`/api/products/${slug}`)
      .then((detail) => {
        setProduct(detail.product);
        setSelectedVariantId(detail.product.variants[0]?.id || null);
        setSelectedPlanId(detail.product.variants[0]?.plans[0]?.id || null);
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  function selectVariant(variantId) {
    const variant = product.variants.find((item) => item.id === variantId);
    setSelectedVariantId(variantId);
    setSelectedPlanId(variant?.plans[0]?.id || null);
  }

  if (loading && !product) {
    return <main className={styles.centerState}>Loading products...</main>;
  }

  if (error || !product || !selectedVariant) {
    return <main className={styles.centerState}>Unable to load product data.</main>;
  }

  return (
    <main className={styles.appShell}>
      <nav className={styles.topbar} aria-label="Product navigation">
        <div className={styles.brandMark}>
          <Smartphone size={19} />
          <span>FundBack EMI</span>
        </div>
        <div className={styles.productTabs}>
          {products.map((item) => (
            <button
              key={item.slug}
              className={cx(styles.tab, item.slug === product.slug && styles.active)}
              type="button"
              onClick={() => openProduct(item.slug)}
            >
              {item.name}
            </button>
          ))}
        </div>
      </nav>

      <section className={styles.productLayout}>
        <aside className={styles.productCard}>
          <div className={styles.badge}>{product.badge}</div>
          <h1>{product.name}</h1>
          <p>{selectedVariant.storage}</p>
          <div className={styles.phoneFrame}>
            <img src={selectedVariant.imageUrl || product.imageUrl} alt={`${product.name} ${selectedVariant.finish}`} />
          </div>
          <div className={styles.variantPicker}>
            <span>Available in {product.variants.length} variants</span>
            <div className={styles.swatches} role="radiogroup" aria-label="Choose variant">
              {product.variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  className={cx(styles.swatch, variant.id === selectedVariant.id && styles.active)}
                  aria-label={`${variant.colorName} ${variant.storage}`}
                  style={{ '--swatch': variant.colorHex }}
                  onClick={() => selectVariant(variant.id)}
                />
              ))}
            </div>
          </div>
        </aside>

        <section className={styles.detailsPanel}>
          <div className={styles.priceRow}>
            <div>
              <div className={styles.price}>{formatRupees(selectedVariant.price)}</div>
              <div className={styles.mrp}>{formatRupees(selectedVariant.mrp)}</div>
            </div>
            <div className={styles.variantSelect}>
              <select
                value={selectedVariant.id}
                onChange={(event) => selectVariant(Number(event.target.value))}
                aria-label="Select variant"
              >
                {product.variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.finish} · {variant.storage}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} />
            </div>
          </div>

          <p className={styles.subtitle}>EMI plans backed by mutual funds</p>
          <p className={styles.description}>{product.description}</p>

          <div className={styles.planList} role="radiogroup" aria-label="Choose EMI plan">
            {selectedVariant.plans.map((plan) => (
              <button
                key={plan.id}
                className={cx(styles.plan, plan.id === selectedPlan?.id && styles.selected)}
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
              >
                <span className={styles.planMain}>
                  <strong>{formatRupees(plan.monthlyPayment)} x {plan.tenureMonths} months</strong>
                  <span>{plan.interestRate === 0 ? '0%' : `${plan.interestRate}%`} interest</span>
                </span>
                <span className={styles.planMeta}>
                  Additional cashback of {formatRupees(plan.cashback)}
                  {plan.isPopular && <em>Popular</em>}
                </span>
                <span className={styles.fundName}>
                  <ShieldCheck size={15} />
                  {plan.partnerFund}
                </span>
              </button>
            ))}
          </div>

          <button className={styles.checkoutButton} type="button" disabled={!selectedPlan}>
            Proceed with {selectedPlan ? `${selectedPlan.tenureMonths} month EMI` : 'selected plan'}
            <ArrowRight size={18} />
          </button>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
