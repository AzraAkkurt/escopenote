import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ROUTES = ['/', '/library', '/notes', '/chat', '/settings'] as const;

interface UseKeyboardShortcutsOptions {
  onNewChat?: () => void;
  onShowHelp?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onNewChat,
  onShowHelp,
  enabled = true,
}: UseKeyboardShortcutsOptions): void {
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key >= '1' && e.key <= '5') {
        const index = Number(e.key) - 1;
        e.preventDefault();
        navigate(ROUTES[index] ?? '/');
        return;
      }

      if (mod && e.key.toLowerCase() === 'n' && onNewChat) {
        e.preventDefault();
        navigate('/chat');
        onNewChat();
        return;
      }

      if (e.key === '?' && onShowHelp) {
        e.preventDefault();
        onShowHelp();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, navigate, onNewChat, onShowHelp]);
}
