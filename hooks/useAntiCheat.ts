// hooks/useAntiCheat.ts
// Client-side anti-cheat hook for native assessments

import { useState, useEffect, useCallback, useRef } from 'react';

interface AntiCheatOptions {
  enabled: boolean;
  maxTabSwitches: number;
  requireFullscreen: boolean;
  disableCopyPaste: boolean;
  onAutoSubmit?: () => void;
}

interface AntiCheatState {
  tabSwitches: number;
  fullscreenExits: number;
  copyAttempts: number;
  warnings: string[];
  violations: Array<{
    type: string;
    timestamp: string;
    detail?: string;
  }>;
}

export function useAntiCheat({
  enabled,
  maxTabSwitches,
  requireFullscreen,
  disableCopyPaste,
  onAutoSubmit,
}: AntiCheatOptions) {
  const [state, setState] = useState<AntiCheatState>({
    tabSwitches: 0,
    fullscreenExits: 0,
    copyAttempts: 0,
    warnings: [],
    violations: [],
  });

  const stateRef = useRef(state);
  const onAutoSubmitRef = useRef(onAutoSubmit);
  const maxTabSwitchesRef = useRef(maxTabSwitches);
  const autoSubmittedRef = useRef(false);

  // Keep refs in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    onAutoSubmitRef.current = onAutoSubmit;
  }, [onAutoSubmit]);

  useEffect(() => {
    maxTabSwitchesRef.current = maxTabSwitches;
  }, [maxTabSwitches]);

  const addViolation = useCallback((type: string, detail?: string) => {
    setState(prev => {
      const violation = { type, timestamp: new Date().toISOString(), detail };
      const warning = `${type}${detail ? `: ${detail}` : ''}`;

      // Check if adding this violation exceeds max tab switches
      const newTabSwitches = type === 'tab_switch' ? prev.tabSwitches + 1 : prev.tabSwitches;

      if (type === 'tab_switch' && newTabSwitches >= maxTabSwitchesRef.current && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        // Defer the callback to avoid blocking state update
        setTimeout(() => {
          onAutoSubmitRef.current?.();
        }, 0);
      }

      return {
        ...prev,
        tabSwitches: newTabSwitches,
        violations: [...prev.violations, violation],
        warnings: [...prev.warnings, warning],
      };
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Track tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // User returned to the tab
        setState(prev => {
          const newTabSwitches = prev.tabSwitches + 1;

          if (newTabSwitches >= maxTabSwitchesRef.current && !autoSubmittedRef.current) {
            autoSubmittedRef.current = true;
            setTimeout(() => {
              onAutoSubmitRef.current?.();
            }, 0);
          }

          return {
            ...prev,
            tabSwitches: newTabSwitches,
            violations: [
              ...prev.violations,
              { type: 'tab_switch', timestamp: new Date().toISOString() },
            ],
            warnings: [
              ...prev.warnings,
              `Tab switch detected (${newTabSwitches}/${maxTabSwitchesRef.current})`,
            ],
          };
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Track fullscreen exits
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && requireFullscreen) {
        setState(prev => ({
          ...prev,
          fullscreenExits: prev.fullscreenExits + 1,
          violations: [
            ...prev.violations,
            { type: 'fullscreen_exit', timestamp: new Date().toISOString() },
          ],
          warnings: [
            ...prev.warnings,
            `Fullscreen exited (${prev.fullscreenExits + 1} times)`,
          ],
        }));
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Track copy/paste/contextmenu
    const handleCopyPaste = (e: Event) => {
      if (disableCopyPaste) {
        e.preventDefault();
        setState(prev => ({
          ...prev,
          copyAttempts: prev.copyAttempts + 1,
          violations: [
            ...prev.violations,
            {
              type: 'copy_paste',
              timestamp: new Date().toISOString(),
              detail: e.type,
            },
          ],
          warnings: [
            ...prev.warnings,
            `${e.type} attempt blocked (${prev.copyAttempts + 1} times)`,
          ],
        }));
      }
    };

    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('contextmenu', handleCopyPaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('contextmenu', handleCopyPaste);
    };
  }, [enabled, requireFullscreen, disableCopyPaste]);

  // Request fullscreen on mount if required
  useEffect(() => {
    if (enabled && requireFullscreen && document.fullscreenElement === null) {
      document.documentElement.requestFullscreen().catch(() => {
        // Ignore errors (browser may block)
      });
    }
  }, [enabled, requireFullscreen]);

  return {
    ...state,
    addViolation,
  };
}
