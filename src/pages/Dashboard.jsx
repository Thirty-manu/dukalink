import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

function formatKes(value) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    imageUrl: "",
  });
  const [savingProduct, setSavingProduct] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [profileForm, setProfileForm] = useState({
    businessName: "",
    phone: "",
    location: "",
    description: "",
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  const shopName =
    currentUser?.displayName?.trim() ||
    currentUser?.email?.split("@")[0] ||
    "My shop";

  const storefrontPath = `/store/${currentUser?.uid || ""}`;

  useEffect(() => {
    if (!currentUser?.uid) return undefined;

    async function loadShopProfile() {
      try {
        setProfileLoading(true);
        const shopSnapshot = await getDoc(doc(db, "shops", currentUser.uid));

        if (shopSnapshot.exists()) {
          const shopData = shopSnapshot.data();

          setProfileForm({
            businessName: shopData.businessName || "",
            phone: shopData.phone || "",
            location: shopData.location || "",
            description: shopData.description || "",
          });
        }
      } catch (loadProfileError) {
        console.error(loadProfileError);
        setProfileError("Could not load your shop profile.");
      } finally {
        setProfileLoading(false);
      }
    }

    loadShopProfile();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser?.uid) return undefined;

    const productsQuery = query(
      collection(db, "products"),
      where("shopId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        setProducts(
          snapshot.docs.map((productDocument) => ({
            id: productDocument.id,
            ...productDocument.data(),
          }))
        );
      },
      (snapshotError) => {
        console.error(snapshotError);
        setError("Could not load products. Please refresh the page.");
      }
    );

    return unsubscribe;
  }, [currentUser?.uid]);

  function updateForm(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function updateProfileForm(event) {
    const { name, value } = event.target;

    setProfileForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleSaveProfile(event) {
    event.preventDefault();
    setProfileError("");
    setProfileMessage("");

    if (!profileForm.businessName.trim()) {
      setProfileError("Add a business name for your shop.");
      return;
    }

    try {
      setSavingProfile(true);

      await setDoc(
        doc(db, "shops", currentUser.uid),
        {
          businessName: profileForm.businessName.trim(),
          phone: profileForm.phone.trim(),
          location: profileForm.location.trim(),
          description: profileForm.description.trim(),
        },
        { merge: true }
      );

      setProfileMessage("Shop profile updated.");
    } catch (saveProfileError) {
      console.error(saveProfileError);
      setProfileError("Could not save your shop profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAddProduct(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.name.trim() || !form.price) {
      setError("Add a product name and price.");
      return;
    }

    const price = Number(form.price);

    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a valid price greater than zero.");
      return;
    }

    try {
      setSavingProduct(true);

      await addDoc(collection(db, "products"), {
        shopId: currentUser.uid,
        name: form.name.trim(),
        price,
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
        createdAt: serverTimestamp(),
      });

      setForm({
        name: "",
        price: "",
        description: "",
        imageUrl: "",
      });

      setMessage("Product added to your shop.");
    } catch (addProductError) {
      console.error(addProductError);
      setError("Could not add this product. Please try again.");
    } finally {
      setSavingProduct(false);
    }
  }

  async function handleDeleteProduct(productId) {
    const shouldDelete = window.confirm("Remove this product from your shop?");

    if (!shouldDelete) return;

    setError("");
    setMessage("");

    try {
      await deleteDoc(doc(db, "products", productId));
      setMessage("Product removed.");
    } catch (deleteProductError) {
      console.error(deleteProductError);
      setError("Could not remove this product. Please try again.");
    }
  }

  async function copyStorefrontLink() {
    const storefrontUrl = `${window.location.origin}${storefrontPath}`;

    try {
      await navigator.clipboard.writeText(storefrontUrl);
      setMessage("Storefront link copied.");
    } catch (clipboardError) {
      console.error(clipboardError);
      setError(`Copy this link: ${storefrontUrl}`);
    }
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Seller workspace</p>
          <h1>{shopName}</h1>
          <p className="dashboard-subtitle">
            Keep your catalog fresh and make it easy for customers to reach you.
          </p>
        </div>

        <div className="dashboard-actions">
          <a className="primary-button" href={storefrontPath} target="_blank" rel="noreferrer">
            View storefront
          </a>
          <button className="secondary-button" type="button" onClick={copyStorefrontLink}>
            Copy link
          </button>
        </div>
      </section>

      <section className="dashboard-card profile-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">Shop profile</p>
            <h2>Business details</h2>
          </div>
        </div>

        {profileLoading ? (
          <p className="profile-loading">Loading your shop profile...</p>
        ) : (
          <form className="product-form profile-form" onSubmit={handleSaveProfile}>
            <label>
              Business name
              <input
                name="businessName"
                value={profileForm.businessName}
                onChange={updateProfileForm}
                placeholder="e.g. Manuk Thirty Shop"
                required
              />
            </label>

            <label>
              WhatsApp phone number
              <input
                name="phone"
                value={profileForm.phone}
                onChange={updateProfileForm}
                placeholder="e.g. 2547XXXXXXXX"
              />
              <small>Use the international format without a plus sign.</small>
            </label>

            <label>
              Location
              <input
                name="location"
                value={profileForm.location}
                onChange={updateProfileForm}
                placeholder="e.g. Nairobi, Kenya"
              />
            </label>

            <label>
              Shop description
              <textarea
                name="description"
                value={profileForm.description}
                onChange={updateProfileForm}
                placeholder="Tell customers what your shop sells"
                rows="3"
              />
            </label>

            {profileError && <p className="form-error">{profileError}</p>}
            {profileMessage && <p className="form-success">{profileMessage}</p>}

            <button className="primary-button form-button" type="submit" disabled={savingProfile}>
              {savingProfile ? "Saving profile..." : "Save profile"}
            </button>
          </form>
        )}
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">Catalog</p>
              <h2>Add a product</h2>
            </div>
            <span>{products.length} listed</span>
          </div>

          <form className="product-form" onSubmit={handleAddProduct}>
            <label>
              Product name
              <input
                name="name"
                value={form.name}
                onChange={updateForm}
                placeholder="e.g. Linen shirt"
                required
              />
            </label>

            <label>
              Price in KES
              <input
                name="price"
                type="number"
                min="1"
                step="1"
                value={form.price}
                onChange={updateForm}
                placeholder="2500"
                required
              />
            </label>

            <label>
              Short description
              <textarea
                name="description"
                value={form.description}
                onChange={updateForm}
                placeholder="A few useful details about the product"
                rows="4"
              />
            </label>

            <label>
              Product image URL <span className="optional-label">(optional)</span>
              <input
                name="imageUrl"
                type="url"
                value={form.imageUrl}
                onChange={updateForm}
                placeholder="https://example.com/product-image.jpg"
              />
              <small>Paste a public image link. No file upload or payment is needed.</small>
            </label>

            {form.imageUrl && (
              <div className="upload-preview">
                <img src={form.imageUrl} alt="Product preview" />
                <button
                  type="button"
                  onClick={() =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      imageUrl: "",
                    }))
                  }
                >
                  Remove image
                </button>
              </div>
            )}

            {error && <p className="form-error">{error}</p>}
            {message && <p className="form-success">{message}</p>}

            <button className="primary-button form-button" type="submit" disabled={savingProduct}>
              {savingProduct ? "Adding product..." : "Add product"}
            </button>
          </form>
        </div>

        <div className="dashboard-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">Your products</p>
              <h2>Catalog preview</h2>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="empty-state">
              <p>No products yet.</p>
              <span>Add your first item using the form.</span>
            </div>
          ) : (
            <div className="product-list">
              {products.map((product) => (
                <article className="dashboard-product" key={product.id}>
                  {product.imageUrl ? (
                    <img
                      className="dashboard-product-image"
                      src={product.imageUrl}
                      alt={product.name}
                    />
                  ) : (
                    <div className="dashboard-product-placeholder" aria-hidden="true">
                      {product.name?.charAt(0)?.toUpperCase() || "P"}
                    </div>
                  )}

                  <div className="dashboard-product-content">
                    <h3>{product.name}</h3>
                    {product.description && <p>{product.description}</p>}
                  </div>

                  <div className="dashboard-product-side">
                    <strong>{formatKes(product.price)}</strong>
                    <button
                      className="text-button"
                      type="button"
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
    </main>
  );
}
