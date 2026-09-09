import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { buildWhatsAppLink } from "../lib/whatsapp";

export default function Storefront() {
  const { slug } = useParams();

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStorefront() {
      try {
        setLoading(true);
        setError("");

        let shopData = null;

        const shopByIdSnapshot = await getDoc(doc(db, "shops", slug));

        if (shopByIdSnapshot.exists()) {
          shopData = {
            id: shopByIdSnapshot.id,
            ...shopByIdSnapshot.data(),
          };
        } else {
          const shopBySlugQuery = query(
            collection(db, "shops"),
            where("slug", "==", slug)
          );

          const shopBySlugSnapshot = await getDocs(shopBySlugQuery);

          if (!shopBySlugSnapshot.empty) {
            const shopDocument = shopBySlugSnapshot.docs[0];

            shopData = {
              id: shopDocument.id,
              ...shopDocument.data(),
            };
          }
        }

        if (!shopData) {
          setError(
            `No shop matches this link: ${slug}. Check the slug in Firestore.`
          );
          setShop(null);
          setProducts([]);
          return;
        }

        setShop(shopData);

        const productsQuery = query(
          collection(db, "products"),
          where("shopId", "==", shopData.id)
        );

        const productsSnapshot = await getDocs(productsQuery);

        const productList = productsSnapshot.docs.map((product) => ({
          id: product.id,
          ...product.data(),
        }));

        setProducts(productList);
      } catch (loadError) {
        console.error(loadError);
        setError("Something went wrong while loading this shop.");
      } finally {
        setLoading(false);
      }
    }

    loadStorefront();
  }, [slug]);

  if (loading) {
    return (
      <main className="storefront-page">
        <p className="storefront-loading">Loading shop...</p>
      </main>
    );
  }

  if (error || !shop) {
    return (
      <main className="storefront-page">
        <div className="storefront-missing">
          <p className="eyebrow storefront-eyebrow">DukaLink</p>
          <h1>Shop not found</h1>
          <p>{error || "This shop link is no longer active."}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="storefront-page">
      <section className="storefront-header">
        <p className="eyebrow storefront-eyebrow">DukaLink storefront</p>
        <h1>{shop.businessName}</h1>

        {shop.description && (
          <p className="storefront-description">{shop.description}</p>
        )}

        {shop.location && (
          <p className="storefront-meta">Location: {shop.location}</p>
        )}
      </section>

      {products.length === 0 ? (
        <div className="storefront-empty">
          <p>This shop has not added any products yet.</p>
        </div>
      ) : (
        <section className="storefront-grid">
          {products.map((product) => (
            <article className="storefront-card" key={product.id}>
              <div className="storefront-card-body">
                <h3>{product.name}</h3>
                <p>{product.description || "No description added."}</p>
              </div>

              <div className="storefront-card-footer">
                <strong>
                  KES {Number(product.price || 0).toLocaleString()}
                </strong>

                <a
                  className="whatsapp-button"
                  href={buildWhatsAppLink(
                    shop.phone,
                    product.name,
                    product.price
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  Order on WhatsApp
                </a>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
