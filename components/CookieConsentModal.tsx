'use client';

import { useState, useEffect } from 'react';
import { X, Check, Shield, Settings, Cookie } from 'lucide-react';

type CookieCategory = {
  id: string;
  name: string;
  description: string;
  required: boolean;
  defaultChecked: boolean;
};

const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    id: 'essential',
    name: 'Essential Cookies',
    description: 'Required for the app to function (authentication, security). Cannot be disabled.',
    required: true,
    defaultChecked: true,
  },
  {
    id: 'analytics',
    name: 'Analytics Cookies',
    description: 'Help us understand how visitors interact with our platform (Vercel Analytics).',
    required: false,
    defaultChecked: false,
  },
  {
    id: 'functional',
    name: 'Functional Cookies',
    description: 'Remember your preferences like theme, language, and display settings.',
    required: false,
    defaultChecked: false,
  },
  {
    id: 'marketing',
    name: 'Marketing Cookies',
    description: 'Used to deliver relevant advertisements and track campaign effectiveness.',
    required: false,
    defaultChecked: false,
  },
];

const COOKIE_CONSENT_KEY = 'aplusmentality_cookie_consent';

function getStoredConsent() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function storeConsent(consent: { accepted: boolean; categories: string[]; date: string }) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

export default function CookieConsentModal() {
  const [showModal, setShowModal] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [categories, setCategories] = useState<CookieCategory[]>(COOKIE_CATEGORIES);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      // Show modal after a short delay for better UX
      const timer = setTimeout(() => setShowModal(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allCategories = categories.map((c) => c.id);
    storeConsent({
      accepted: true,
      categories: allCategories,
      date: new Date().toISOString(),
    });
    setShowModal(false);
    applyConsent(allCategories);
  };

  const handleRejectAll = () => {
    const essentialOnly = categories.filter((c) => c.required).map((c) => c.id);
    storeConsent({
      accepted: false,
      categories: essentialOnly,
      date: new Date().toISOString(),
    });
    setShowModal(false);
    applyConsent(essentialOnly);
  };

  const handleSavePreferences = () => {
    const selected = categories.filter((c) => c.required || c.defaultChecked).map((c) => c.id);
    storeConsent({
      accepted: selected.length > categories.filter((c) => c.required).length,
      categories: selected,
      date: new Date().toISOString(),
    });
    setShowModal(false);
    applyConsent(selected);
  };

  const toggleCategory = (id: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === id && !cat.required
          ? { ...cat, defaultChecked: !cat.defaultChecked }
          : cat
      )
    );
  };

  const applyConsent = (acceptedCategories: string[]) => {
    // Dispatch a custom event so other parts of the app can react
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('cookie-consent', {
          detail: { acceptedCategories },
        })
      );
    }
    // Conditionally load analytics scripts
    if (acceptedCategories.includes('analytics')) {
      // Analytics is already loaded via @vercel/analytics in layout.tsx
      console.log('Analytics cookies accepted');
    }
  };

  if (!showModal) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998] backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed bottom-0 right-0 left-0 md:bottom-4 md:right-4 md:left-auto md:w-[480px] z-[9999] p-4 md:p-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
      >
        <div className="bg-card rounded-2xl shadow-2xl border border-border max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Cookie className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2
                  id="cookie-consent-title"
                  className="text-lg font-semibold text-foreground"
                >
                  {showPreferences ? 'Cookie Preferences' : 'Manage Cookies'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {showPreferences
                    ? 'Choose which cookies to allow'
                    : 'We use cookies to improve your experience'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (showPreferences) {
                  setShowPreferences(false);
                } else {
                  handleRejectAll();
                }
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted dark:hover:bg-card text-muted-foreground hover:text-muted-foreground dark:hover:text-foreground transition"
              aria-label={showPreferences ? 'Close preferences' : 'Dismiss cookie notice'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {showPreferences ? (
            /* Preferences Panel */
            <div className="px-6 pb-4 space-y-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-start justify-between gap-4 p-4 rounded-xl bg-muted"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">
                        {cat.name}
                      </span>
                      {cat.required && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {cat.description}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={cat.defaultChecked}
                      disabled={cat.required}
                      onChange={() => toggleCategory(cat.id)}
                      className="sr-only peer"
                      aria-label={`Toggle ${cat.name}`}
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer  peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-border peer-checked:bg-blue-600" />
                  </label>
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleRejectAll}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground bg-muted dark:bg-card hover:bg-muted  rounded-xl transition"
                >
                  Reject All
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground bg-blue-600 hover:bg-blue-700 rounded-xl transition"
                >
                  Accept All
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground bg-green-600 hover:bg-green-700 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>
          ) : (
            /* Main Cookie Notice */
            <div className="px-6 pb-6 space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  We use essential cookies to keep your account secure and analytics cookies to
                  understand how our platform is used. You can manage your preferences at any time.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleRejectAll}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground bg-muted dark:bg-card hover:bg-muted  rounded-xl transition"
                >
                  Reject All
                </button>
                <button
                  onClick={() => setShowPreferences(true)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground bg-muted dark:bg-card hover:bg-muted  rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Settings className="w-4 h-4" />
                  Manage
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Accept All
                </button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                By accepting, you agree to our{' '}
                <a
                  href="/privacy-policy"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a
                  href="/terms-of-service"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Terms of Service
                </a>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
