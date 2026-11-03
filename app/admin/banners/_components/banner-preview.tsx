'use client';

interface BannerPreviewProps {
  title: string;
  message: string;
  ctaLabel: string;
  imageUrl: string;
  variant: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER' | 'PROMO';
  placement: 'HOMEPAGE' | 'DASHBOARD' | 'BOTH';
  scope: 'GLOBAL' | 'ALL' | 'SPECIFIC';
  institutionIds: string[];
  isActive: boolean;
  priority: number;
}

const variantStyles: Record<string, { bg: string; border: string; text: string }> = {
  INFO: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-l-blue-500',
    text: 'text-blue-800 dark:text-blue-200',
  },
  SUCCESS: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    border: 'border-l-green-500',
    text: 'text-green-800 dark:text-green-200',
  },
  WARNING: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-l-blue-500',
    text: 'text-blue-800 dark:text-blue-200',
  },
  DANGER: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    border: 'border-l-red-500',
    text: 'text-red-800 dark:text-red-200',
  },
  PROMO: {
    bg: 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30',
    border: 'border-l-purple-500',
    text: 'text-purple-800 dark:text-purple-200',
  },
};

export default function BannerPreview({
  title,
  message,
  ctaLabel,
  imageUrl,
  variant,
  placement,
  scope,
  institutionIds,
  isActive,
  priority,
}: BannerPreviewProps) {
  const style = variantStyles[variant] || variantStyles.INFO;

  const getScopeLabel = () => {
    if (scope === 'GLOBAL') return '🌍 Everyone (including logged-out users)';
    if (scope === 'ALL') return '🏫 All universities (logged-in users)';
    if (institutionIds.length > 0) {
      return `🎓 ${institutionIds.length} selected university${institutionIds.length > 1 ? 'ies' : ''}`;
    }
    return '⚠️ No universities selected';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Live Preview
      </h3>
      <div
        className={`${style.bg} border-l-4 ${style.border} px-4 py-3 rounded-lg`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold text-sm ${style.text}`}>
              {title || 'Banner Title'}
            </h4>
            <p className={`text-sm mt-1 ${style.text} opacity-80`}>
              {message || 'Banner message will appear here...'}
            </p>
            {ctaLabel && (
              <span
                className={`inline-flex items-center mt-2 px-3 py-1 text-xs font-medium rounded-md ${
                  style.text.replace('text-', 'bg-').replace('800', '600').replace('200', '600')
                } text-white`}
              >
                {ctaLabel}
              </span>
            )}
          </div>
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Preview"
              className="hidden sm:block w-20 h-14 object-cover rounded-lg flex-shrink-0"
            />
          )}
        </div>
      </div>
      <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
        <p>Placement: {placement === 'HOMEPAGE' ? 'Homepage' : placement === 'DASHBOARD' ? 'Dashboard' : 'Both'}</p>
        <p>Priority: {priority}</p>
        <p>Status: {isActive ? 'Active' : 'Inactive'}</p>
        <p className="font-medium text-gray-600 dark:text-gray-300">
          Will appear to: {getScopeLabel()}
        </p>
      </div>
    </div>
  );
}
