import { useEffect } from "react";

function upsertMeta(attr, key, content) {
  if (!content) return;
  let node = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attr, key);
    document.head.appendChild(node);
  }
  node.setAttribute("content", content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let node = document.head.querySelector(`link[rel="${rel}"]`);
  if (!node) {
    node = document.createElement("link");
    node.setAttribute("rel", rel);
    document.head.appendChild(node);
  }
  node.setAttribute("href", href);
}

function upsertJsonLd(id, data) {
  const existing = document.getElementById(id);
  if (!data) {
    existing?.remove();
    return;
  }
  const script = existing ?? document.createElement("script");
  script.id = id;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  if (!existing) document.head.appendChild(script);
}

/**
 * SPA'da sayfa başlığı, description, canonical ve isteğe bağlı JSON-LD yazar.
 * Asıl tarayıcı/SEO HTML kabuğu build script ile de üretilir.
 */
export function useDocumentMeta({
  title,
  description,
  canonical,
  jsonLd = null,
  jsonLdId = "page-jsonld",
} = {}) {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) document.title = title;
    if (description) upsertMeta("name", "description", description);
    if (canonical) {
      upsertLink("canonical", canonical);
      upsertMeta("property", "og:url", canonical);
    }
    if (title) upsertMeta("property", "og:title", title);
    if (description) upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", "website");
    upsertJsonLd(jsonLdId, jsonLd);

    return () => {
      document.title = previousTitle;
      upsertJsonLd(jsonLdId, null);
    };
  }, [title, description, canonical, jsonLd, jsonLdId]);
}
