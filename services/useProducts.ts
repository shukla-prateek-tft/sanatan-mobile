/**
 * useProducts.ts
 *
 * Firestore hook for the Shop screen.
 *
 * Firestore structure (collection: "products"):
 * /products/{docId}
 *   name:        string        "Rudraksha Mala"
 *   nameHi:      string        "रुद्राक्ष माला"
 *   description: string        Short product description
 *   descHi:      string        Hindi description
 *   price:       string        "₹499" or "Free"
 *   imageUrl:    string        Direct image URL
 *   affiliateUrl: string       Your affiliate / buy link
 *   category:    string        "puja" | "books" | "jewelry" | "decor" | "other"
 *   badge:       string?       "New" | "Bestseller" | "Sacred" | null
 *   isFeatured:  boolean       Show in featured row
 *   isActive:    boolean       Set false to hide without deleting
 *   sortOrder:   number        Lower = shown first
 *   createdAt:   Timestamp
 *
 * Dashboard (Firebase Console) steps:
 *   1. Go to Firestore → Create collection "products"
 *   2. Add a document with the fields above
 *   3. Set isActive: true to make it visible in app
 *   4. Paste your affiliate URL in affiliateUrl field
 *
 * Categories filter tabs are derived automatically from your data.
 */

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  DocumentData,
  QuerySnapshot,
} from "firebase/firestore";
import { db } from "@/firebase";
// adjust path to your firebase config

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  descHi: string;
  price: string;
  imageUrl: string;
  affiliateUrl: string;
  category: string;
  badge?: string;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
}

export type ProductCategory = "all" | string;

interface UseProductsReturn {
  products: Product[];
  featured: Product[];
  categories: string[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// ─────────────────────────────────────────────
// HELPER — map Firestore doc → Product
// ─────────────────────────────────────────────
function mapDoc(doc: DocumentData & { id: string }): Product {
  const d = doc.data ? doc.data() : doc;
  return {
    id: doc.id,
    name: d.name ?? "Unnamed Product",
    nameHi: d.nameHi ?? "",
    description: d.description ?? "",
    descHi: d.descHi ?? "",
    price: d.price ?? "",
    imageUrl: d.imageUrl ?? "",
    affiliateUrl: d.affiliateUrl ?? "",
    category: d.category ?? "other",
    badge: d.badge ?? undefined,
    isFeatured: d.isFeatured ?? false,
    isActive: d.isActive ?? true,
    sortOrder: d.sortOrder ?? 999,
  };
}

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────
export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const q = query(
      collection(db, "products"),
      where("isActive", "==", true),
      orderBy("sortOrder", "asc"),
    );

    // Real-time listener — products update instantly when you change Firestore
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const docs = snap.docs.map((d) =>
          mapDoc({ ...d.data(), id: d.data().id }),
        );
        setProducts(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useProducts]", err);
        setError("Could not load products. Check your connection.");
        setLoading(false);
      },
    );

    return () => unsub();
  }, [refreshKey]);

  const featured = products.filter((p) => p.isFeatured);

  // Build category list from actual data (deduplicated, sorted)
  const categories = [
    "all",
    ...Array.from(new Set(products.map((p) => p.category))).sort(),
  ];

  return { products, featured, categories, loading, error, refresh };
}

// ─────────────────────────────────────────────
// CATEGORY DISPLAY LABELS  (bilingual)
// Add more as needed — unknown categories fall back to title-case
// ─────────────────────────────────────────────
export const CATEGORY_LABELS: Record<
  string,
  { en: string; hi: string; emoji: string }
> = {
  all: { en: "All", hi: "सभी", emoji: "🛍️" },
  puja: { en: "Puja", hi: "पूजा", emoji: "🪔" },
  books: { en: "Books", hi: "पुस्तकें", emoji: "📚" },
  jewelry: { en: "Jewelry", hi: "आभूषण", emoji: "💎" },
  decor: { en: "Decor", hi: "सजावट", emoji: "🏡" },
  other: { en: "Other", hi: "अन्य", emoji: "✨" },
};

export function getCategoryLabel(cat: string): {
  en: string;
  hi: string;
  emoji: string;
} {
  return (
    CATEGORY_LABELS[cat] ?? {
      en: cat.charAt(0).toUpperCase() + cat.slice(1),
      hi: cat,
      emoji: "🌸",
    }
  );
}
