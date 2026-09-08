import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
  });
  const [loadingShop, setLoadingShop] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      return;
    }

    async function loadShop() {
      try {
        const shopSnapshot = await getDoc(doc(db, "shops", currentUser.uid));

        if (shopSnapshot.exists()) {
          setShop(shopSnapshot.data());
        } else {
          setError("Your shop profile could not be found.");
        }
      } catch {
        setError("Could not load your shop profile.");
      } finally {
        setLoadingShop(false);
      }
    }

    loadShop();

    const productsQuery = query(
      collection(db, "products"),
      where("shopId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        const productList = snapshot.docs.map((product) => ({
          id: product.id,
          ...product.data(),
        }));

        setProducts(productList);
      },
      () => setError("Could not load your products.")
    );

    return unsubscribe;
  }, [currentUser, navigate]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleAddProduct(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.name.trim() || !form.price) {
      setError("Add a product name and price.");
      return;
    }

    try {
      setSavingProduct(true);

      await addDoc(collection(db, "products"), {
        shopId: currentUser.uid,
        name: form.name.trim(),
        price: Number(form.price),
        description: form.description.trim(),
        createdAt: serverTimestamp(),
      });

      setForm({
        name: "",
        price: "",
        description: "",
      });

      setMessage("Product added to your shop.");
    } catch {
      setError("Could not add this product. Please try again.");
    } finally {
      setSavingProduct(false);
    }
  }

  async function handleDeleteProduct(productId) {
    const shouldDelete = window.confirm("Remove this product from your shop?");

    if (!shouldDelete) {
      return;
    }

    try {
      await deleteDoc(doc(db, "products", productId));
      setMessage("Product removed.");
    } catch {
      setError("Could not remove this product.");
    }
  }

  async function copyStorefrontLink() {
    if (!shop?.slug) {
      return;
    }

    const storefrontUrl = `${window.location.origin}/store/${shop.slug}`;

    try {
      await navigator.clipboard.writeText(storefrontUrl);
      setMessage("Storefront link copied.");
    } catch {
      setError("Could not copy the link. You can open it instead.");
    }
  }

  if (loadingShop) {
    return (
      <main className="dashboard-page">
        <p className="dashboard-loading">Loading your shop...</p>
      </main>
    );
  }

  const storefrontUrl = shop?.slug
    ? `${window.location.origin}/store/${shop.slug}`
    : "";

  return (
    <main className="dashboard-page">
      <section className="dashboard-heading">
        <div>
          <p className="eyebrow dashboard-eyebrow">Seller workspace</p>
          <h1>{shop?.businessName || "Your shop"}</h1>
          <p className="dashboard-description">
            Keep your catalog fresh and make it easy for customers to reach you.
          </p>
        </div>

        {shop?.slug && (
          <div className="storefront-actions">
            <a
              className="secondary-button"
              href={storefrontUrl}
              target="_blank"
              rel="noreferrer"
            >
              View storefront
            </a>
            <button className="outline-button" onClick={copyStorefrontLink}>
              Copy link
            </button>
          </div>
        )}
      </section>

      {error && <p className="dashboard-message error-message">{error}</p>}
      {message && <p className="dashboard-message success-message">{message}</p>}

      <section className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-label">Catalog</p>
              <h2>Add a product</h2>
            </div>
            <span className="product-count">{products.length} listed</span>
          </div>

          <form className="product-form" onSubmit={handleAddProduct}>
            <label>
              Product name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Linen shirt"
                required
              />
            </label>

            <label>
              Price in KES
              <input
                name="price"
                value={form.price}
                onChange={handleChange}
                type="number"
                min="1"
                placeholder="2500"
                required
              />
            </label>

            <label>
              Short description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="A few useful details about the product"
                rows="4"
              />
            </label>

            <button className="primary-button" type="submit" disabled={savingProduct}>
              {savingProduct ? "Adding product..." : "Add product"}
            </button>
          </form>
        </div>

        <div className="dashboard-panel products-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-label">Your products</p>
              <h2>Catalog preview</h2>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="empty-products">
              <p>No products yet.</p>
              <span>Add your first product using the form.</span>
            </div>
          ) : (
            <div className="product-list">
              {products.map((product) => (
                <article className="product-row" key={product.id}>
                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.description || "No description added."}</p>
                  </div>
                  <div className="product-row-side">
                    <strong>
                      KES {Number(product.price || 0).toLocaleString()}
                    </strong>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-tip">
        <span className="tip-number">01</span>
        <div>
          <h2>Your shop link is your storefront.</h2>
          <p>
            Add products, copy the link, and share it in your WhatsApp status or
            customer conversations.
          </p>
        </div>
        <Link to={shop?.slug ? `/store/${shop.slug}` : "/dashboard"}>
          Open public page
        </Link>
      </section>
    </main>
  );
}
