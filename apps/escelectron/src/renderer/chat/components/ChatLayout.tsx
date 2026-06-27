import type { ReactNode } from 'react';

interface ChatLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function ChatLayout({ sidebar, children }: ChatLayoutProps) {
  return (
    <div className="chat-layout">
      {sidebar}
      <div className="chat-layout__main">{children}</div>
    </div>
  );
}
