import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@renderer/components/layout/AppShell';
import { LoadingState } from '@renderer/components/ui';
import { OverviewPage } from '@renderer/pages/OverviewPage';
import { SettingsPage } from '@renderer/pages/SettingsPage';

const ChatPage = lazy(() =>
  import('@renderer/pages/ChatPage').then((m) => ({ default: m.ChatPage })),
);
const LibraryPage = lazy(() =>
  import('@renderer/pages/LibraryPage').then((m) => ({ default: m.LibraryPage })),
);
const CourseDetailPage = lazy(() =>
  import('@renderer/pages/CourseDetailPage').then((m) => ({ default: m.CourseDetailPage })),
);
const CourseEditPage = lazy(() =>
  import('@renderer/pages/CourseEditPage').then((m) => ({ default: m.CourseEditPage })),
);
const NotesPage = lazy(() =>
  import('@renderer/pages/NotesPage').then((m) => ({ default: m.NotesPage })),
);

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingState className="page-loading" />}>{children}</Suspense>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<OverviewPage />} />
        <Route
          path="library"
          element={
            <LazyPage>
              <LibraryPage />
            </LazyPage>
          }
        />
        <Route
          path="library/:courseId"
          element={
            <LazyPage>
              <CourseDetailPage />
            </LazyPage>
          }
        />
        <Route
          path="library/:courseId/edit"
          element={
            <LazyPage>
              <CourseEditPage />
            </LazyPage>
          }
        />
        <Route
          path="notes"
          element={
            <LazyPage>
              <NotesPage />
            </LazyPage>
          }
        />
        <Route
          path="notes/:noteId"
          element={
            <LazyPage>
              <NotesPage />
            </LazyPage>
          }
        />
        <Route
          path="chat"
          element={
            <LazyPage>
              <ChatPage />
            </LazyPage>
          }
        />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
