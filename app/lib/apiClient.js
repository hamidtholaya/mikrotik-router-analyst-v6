import { Capacitor } from '@capacitor/core';

/**
 * Returns true if running as an installed native mobile app (Android/iOS)
 */
export function isNativeMobile() {
  if (typeof window === 'undefined') return false;
  try {
    return Capacitor.isNativePlatform();
  } catch (e) {
    return false;
  }
}

/**
 * Retrieves the base URL for backend API requests.
 * In Web mode, returns '' (same origin).
 * In Mobile Native mode, reads custom server URL from localStorage or returns empty.
 */
export function getApiBaseUrl() {
  if (typeof window === 'undefined') return '';
  const storedUrl = localStorage.getItem('mikrotik_backend_url');
  if (storedUrl && storedUrl.trim()) {
    return storedUrl.trim().replace(/\/+$/, '');
  }
  return '';
}

/**
 * Saves a custom backend URL (for mobile direct network connection)
 */
export function setApiBaseUrl(url) {
  if (typeof window === 'undefined') return;
  if (!url || !url.trim()) {
    localStorage.removeItem('mikrotik_backend_url');
  } else {
    localStorage.setItem('mikrotik_backend_url', url.trim());
  }
}

/**
 * Unified API Fetch wrapper for Web and Native Mobile
 */
export async function apiFetch(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl();
  const fullUrl = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${baseUrl}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // If session is in localStorage, pass as header for environments without cookie sharing
  if (typeof window !== 'undefined') {
    const sessionData = localStorage.getItem('mikrotik_session');
    if (sessionData && !headers['Authorization']) {
      headers['X-Session-Data'] = sessionData;
    }
  }

  return fetch(fullUrl, {
    ...options,
    headers,
  });
}
