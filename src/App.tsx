import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { HubPage } from "./routes/HubPage";

// A shared parent keeps app chrome alive; only the page view remounts.
const router = createBrowserRouter([{
  element: <HubPage />,
  children: [
    { path: "/", handle: { mode: "home" } },
    { path: "/search", handle: { mode: "search" } },
    { path: "/category/:slug", handle: { mode: "category" } },
    { path: "/resource/:slug/report", handle: { mode: "report" } },
    { path: "/resource/:slug", handle: { mode: "detail" } },
    { path: "/emergency", handle: { mode: "emergency" } },
    { path: "/contacts", handle: { mode: "people" } },
    { path: "*", handle: { mode: "missing" } },
  ],
}]);

export function App() {
  return <RouterProvider router={router} />;
}
