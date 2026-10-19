/**
 * Cookie consent utility
 *
 * Provides server-safe and client-safe helpers for reading and writing
 * the user's cookie consent choice stored in localStorage.
 */

const COOKIE_CONSENT_KEY = 'aplusmentality_cookie_consent';

export interface CookieConsent {
  accepted: boolean;
  categories: string[];
  date: string;
}

/**
 * Client-side only: read the stored cookie consent from localStorage.
 * Returns null if no consent has been recorded or if called on the server.
 */
export function getCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    return stored ? (JSON.parse(stored) as CookieConsent) : null;
  } catch {
    return null;
  }
}

/**
 * Client-side only: check whether a specific cookie category has been accepted.
 * Returns false if no consent has been recorded (caller should treat this as "not consented").
 */
export function isCookieCategoryAccepted(category: string): boolean {
  const consent = getCookieConsent();
  if (!consent) return false;
  return consent.categories.includes(category);
}

/**
 * Client-side only: store a new cookie consent choice.
 */
export function setCookieConsent(consent: CookieConsent) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/**
 * Client-side only: clear the stored cookie consent (for "reset preferences" flows).
 */
export function clearCookieConsent() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
  } catch {
    // Silently fail
  }
}

/**
 * Listen for cookie consent changes dispatched by the CookieConsentModal.
 *
 * @example
 *   useEffect(() => {
 *     const handler = (e: Event) => {
 *       const { acceptedCategories } = (e as CustomEvent).detail;
 *       if (acceptedCategories.includes('analytics')) loadAnalytics();
 *     };
 *     window.addEventListener('cookie-consent', handler);
 *     return () => window.removeEventListener('cookie-consent', handler);
 *   }, []);
 */
export type CookieConsentEvent = CustomEvent<{ acceptedCategories: string[] }>;
