import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { HubPage } from "./routes/HubPage";

const router = createBrowserRouter([
  { path: "/", element: <HubPage mode="home" /> },
  { path: "/search", element: <HubPage mode="search" /> },
  { path: "/category/:slug", element: <HubPage mode="category" /> },
  { path: "/resource/:slug/report", element: <HubPage mode="report" /> },
  { path: "/resource/:slug", element: <HubPage mode="detail" /> },
  { path: "/emergency", element: <HubPage mode="emergency" /> },
  { path: "/contacts", element: <HubPage mode="people" /> },
  { path: "*", element: <HubPage mode="missing" /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}
