import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global Fetch Interceptor to route /api/ requests to Modal VPS if configured.
// It also injects Authorization header with Bearer JWT to bypass cross-origin HttpOnly cookie restrictions.
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let url = typeof input === 'string' 
    ? input 
    : input instanceof URL 
      ? input.toString() 
      : input.url;

  const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  
  if (url.startsWith('/api/')) {
    url = baseUrl + url;
  }

  let newInit = init || {};
  if (url.includes('/api/')) {
    // 1. Handle dynamic local storage cleanup on logout
    if (newInit.body && typeof newInit.body === 'string') {
      try {
        const bodyObj = JSON.parse(newInit.body);
        if (bodyObj && bodyObj.action === 'logout') {
          localStorage.removeItem('biologic_token');
          localStorage.removeItem('biologic_admin_token');
        }
      } catch (e) {
        // ignore
      }
    }

    // 2. Inject Authorization Bearer token
    const token = localStorage.getItem('biologic_token');
    const adminToken = localStorage.getItem('biologic_admin_token');
    
    let headers = new Headers(newInit.headers || {});
    if (token && !headers.has('Authorization')) {
      if (url.includes('admin') && adminToken) {
        headers.set('Authorization', `Bearer ${adminToken}`);
      } else if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }
    newInit.headers = headers;
  }

  if (typeof input === 'string') {
    return originalFetch(url, newInit);
  } else if (input instanceof URL) {
    return originalFetch(new URL(url), newInit);
  } else {
    // Request object
    const newRequest = new Request(url, {
      method: input.method,
      headers: newInit.headers || input.headers,
      body: input.body,
      mode: input.mode,
      credentials: input.credentials,
      cache: input.cache,
      redirect: input.redirect,
      referrer: input.referrer,
      integrity: input.integrity,
    });
    return originalFetch(newRequest);
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

