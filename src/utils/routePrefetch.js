/**
 * Lightweight instant route prefetcher.
 * Preloads JS chunks when the user hovers or starts touch on navigation links.
 */

const preloadedRoutes = new Set();

const routeMap = {
  "/products": () => import("../pages/ProductCatalog"),
  "/categories": () => import("../pages/ProductCategories"),
  "/search": () => import("../pages/SearchP"),
  "/login": () => import("../pages/Login"),
  "/cart": () => import("../pages/CartMobile"),
  "/safety-tips": () => import("../pages/SafetyTips"),
  "/about-us": () => import("../pages/AboutUs"),
  "/contact-us": () => import("../pages/ContactUs"),
};

export const prefetchRoute = (path) => {
  if (!path || preloadedRoutes.has(path)) return;

  const cleanPath = path.split("?")[0].replace(/\/+$/, "") || "/";
  const loader = routeMap[cleanPath];

  if (loader) {
    preloadedRoutes.add(cleanPath);
    loader().catch(() => {
      preloadedRoutes.delete(cleanPath);
    });
  } else if (cleanPath.startsWith("/product/")) {
    if (!preloadedRoutes.has("/product")) {
      preloadedRoutes.add("/product");
      import("../pages/ProductDisplay").catch(() => {
        preloadedRoutes.delete("/product");
      });
    }
  }
};
