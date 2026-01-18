import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Remove Lovable badge
const removeLovableBadge = () => {
  const selectors = [
    '#lovable-badge',
    '[data-lovable-badge]',
    '.lovable-badge',
    '[id*="lovable"]',
    '[class*="lovable"]',
    'a[href*="lovable.dev"]',
    'a[href*="lovable.app"]',
    'iframe[src*="lovable"]',
    '#__lovable',
    '.__lovable',
    '[data-lovable]'
  ];
  
  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => el.remove());
  });
  
  // Remove any fixed positioned elements that aren't part of our app
  document.querySelectorAll('body > *').forEach(el => {
    if (el.id === 'root') return;
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed' && parseInt(style.zIndex) > 9000) {
      el.remove();
    }
  });
};

// Run immediately and on DOM changes
removeLovableBadge();
const observer = new MutationObserver(removeLovableBadge);
observer.observe(document.body, { childList: true, subtree: true });

createRoot(document.getElementById("root")!).render(<App />);
