import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./Layout.tsx";
import { StorefrontPage } from "@/features/storefront/StorefrontPage.tsx";
import { KustomizerPage } from "@/features/kustomizer/KustomizerPage.tsx";
import { VariationsPage } from "@/features/kustomizer/VariationsPage.tsx";
// The admin only exists in the local dev server (admin-local.bat). In the production build
// import.meta.env.DEV is false, so the whole admin and the Telegram test code are left out of the
// public bundle: nothing sensitive ships to visitors.
const AdminPage = import.meta.env.DEV
  ? lazy(() => import("@/features/admin/AdminPage.tsx").then((m) => ({ default: m.AdminPage })))
  : null;

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<StorefrontPage />} />
          {/* The public link, model-free on purpose: a URL ending in a model
              name reads as "this page is for that case only", which confused
              buyers of the other one. The page picks the model itself.
              /kustomize/:modelId still works — the cart and the storefront
              build those, and links already out in the wild keep resolving. */}
          <Route path="kustomize" element={<KustomizerPage />} />
          <Route path="kustomize/:modelId" element={<KustomizerPage />} />
          <Route path="configure/:configId" element={<VariationsPage />} />
          {AdminPage && (
            <Route path="admin_k9x7m" element={<Suspense fallback={null}><AdminPage /></Suspense>} />
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
