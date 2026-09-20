import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from './routes/Home';
import { CategoryPage } from './routes/CategoryPage';
import { ResourcePage } from './routes/ResourcePage';
import { EmergencyPage } from './routes/EmergencyPage';
import { ContactsPage } from './routes/ContactsPage';

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/category/:slug', element: <CategoryPage /> },
  { path: '/resource/:slug', element: <ResourcePage /> },
  { path: '/emergency', element: <EmergencyPage /> },
  { path: '/contacts', element: <ContactsPage /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}
