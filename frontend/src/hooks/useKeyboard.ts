import { useEffect, useCallback } from 'react';

interface KeyBindings {
  [key: string]: () => void;
}

export function useKeyboard(keyBindings: KeyBindings, enabled = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const key = event.key.toLowerCase();
      const combination = [
        event.ctrlKey && 'ctrl',
        event.shiftKey && 'shift',
        event.altKey && 'alt',
        key
      ]
        .filter(Boolean)
        .join('+');

      if (keyBindings[combination]) {
        event.preventDefault();
        keyBindings[combination]();
      } else if (keyBindings[key]) {
        event.preventDefault();
        keyBindings[key]();
      }
    },
    [keyBindings, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
