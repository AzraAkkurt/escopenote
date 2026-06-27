import { HashRouter } from 'react-router-dom';
import { AppRoutes } from '@renderer/routes';

export function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}
