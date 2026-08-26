import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getHomepageMenuCategories } from "../functions/homepage";
import CategoryBar from "./CategoryBar";

const CategoryBarSection = React.memo(() => {
  const location = useLocation();

  const hideCategoryBarOn = useMemo(
    () => [
      "/admin-dashboard",
      "/shop",
      "/cart",
      "/order-history",
      "/cart/checkout",
      "/add-product",
      "/404",
      "*",
      "/pages/",
      "/blogs",
      "/category/",
      "/admin/orders",
      "/admin/coupons",
      "/admin/sections",
    ],
    []
  );

  const [pageFlags, setPageFlags] = useState({ notFound: false, dynamic: false });
  useEffect(() => {
    const updateFlags = () => {
      setPageFlags({
        notFound: document.documentElement.getAttribute("data-not-found") === "true",
        dynamic: document.documentElement.getAttribute("data-dynamic-page") === "true",
      });
    };
    updateFlags();
    const observer = new MutationObserver(() => updateFlags());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-not-found", "data-dynamic-page"],
    });
    return () => observer.disconnect();
  }, []);

  const hideCategoryBar = useMemo(
    () =>
      hideCategoryBarOn.includes(location.pathname) ||
      pageFlags.notFound ||
      pageFlags.dynamic ||
      (function isUnknownPath(path) {
        const knownPrefixes = [
          "/",
          "/product/",
          "/category/",
          "/brand/",
          "/shop",
          "/search",
          "/cart",
          "/order-history",
          "/admin",
          "/signup",
          "/login",
          "/color-settings",
        ];
        if (path === "/") return false;
        return !knownPrefixes.some((p) => path === p || path.startsWith(p));
      })(location.pathname) ||
      location.pathname.startsWith("/pages/") ||
      /^\/edit-product\/[^/]+$/.test(location.pathname) ||
      /^\/product\/[^/]+$/.test(location.pathname) ||
      location.pathname.startsWith("/blogs") ||
      location.pathname.startsWith("/admin/orders/") ||
      location.pathname.startsWith("/admin/new-orders") ||
      location.pathname.startsWith("/category/"),
    [hideCategoryBarOn, location.pathname, pageFlags]
  );

  const [categories, setCategories] = useState([]);
  const [modalState, setModalState] = useState({ isOpen: false, selectedCategory: null });
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const CACHE_KEY = "menu_categories_cache_v1";
    const CACHE_MS = 30 * 60 * 1000;

    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
      if (cached && Array.isArray(cached.items) && Date.now() - cached.ts < CACHE_MS) {
        setCategories(cached.items);
      }
    } catch {}

    const ac = new AbortController();
    const load = async () => {
      try {
        const cats = await getHomepageMenuCategories();
        setCategories(cats || []);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), items: cats || [] }));
        } catch {}
      } catch (e) {
        if (e?.name !== "AbortError" && e?.name !== "CanceledError") {
          console.error("Error fetching menu categories:", e);
        }
      }
    };
    load();
    return () => ac.abort();
  }, []);

  if (hideCategoryBar) return null;

  return (
    <div className="relative z-30">
      <CategoryBar
        categories={categories}
        modalState={modalState}
        modalPosition={modalPosition}
        setModalPosition={setModalPosition}
        setModalState={setModalState}
      />
    </div>
  );
});

CategoryBarSection.displayName = "CategoryBarSection";

export default CategoryBarSection;
