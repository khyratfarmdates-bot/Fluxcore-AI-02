import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";

// Suppress benign warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('THREE.Clock: This module has been deprecated')) {
    return;
  }
  originalWarn(...args);
};

const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('WebSocket closed without opened')) {
    return;
  }
  if (typeof args[0] === 'string' && args[0].includes('Encountered two children with the same key')) {
    originalError("DUPLICATE KEY WARNING CAUGHT:", ...args);
    originalError(new Error().stack);
  }
  originalError(...args);
};

// Global Fetch Interceptor to catch AI key/quota errors
const { fetch: originalFetch } = window;
window.fetch = async (...args) => {
  const [resource] = args;
  const url = typeof resource === 'string' ? resource : resource instanceof URL ? resource.toString() : (resource as any).url;

  if (url && url.includes('/api/ai/')) {
    try {
      const response = await originalFetch(...args);

      if (response.status === 401 || response.status === 429) {
        const clonedRes = response.clone();
        const errJson = await clonedRes.json().catch(() => ({}));
        const errorType = response.status === 429 ? 'limit' : 'expired';
        
        window.dispatchEvent(new CustomEvent('ai-provider-error', { 
          detail: { 
            type: errorType,
            message: errJson.error || 'AI Key or Quota failure'
          } 
        }));
      } else if (response.status === 500) {
        const clonedRes = response.clone();
        const errJson = await clonedRes.json().catch(() => ({}));
        const errMsg = (errJson.error || '').toLowerCase();
        
        if (errMsg.includes('quota') || errMsg.includes('resource_exhausted') || errMsg.includes('rate_limit') || errMsg.includes('exhausted') || errMsg.includes('exceeded')) {
          window.dispatchEvent(new CustomEvent('ai-provider-error', { 
            detail: { type: 'limit', message: errJson.error } 
          }));
        } else if (errMsg.includes('key') || errMsg.includes('invalid') || errMsg.includes('unauthorized') || errMsg.includes('401')) {
          window.dispatchEvent(new CustomEvent('ai-provider-error', { 
            detail: { type: 'expired', message: errJson.error } 
          }));
        }
      }
      return response;
    } catch (err) {
      console.error("[Fetch Interceptor Network Error]", err);
      throw err;
    }
  }

  return originalFetch(...args);
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
