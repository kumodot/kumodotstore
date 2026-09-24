import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./Layout.tsx";
import { StorefrontPage } from "@/features/storefront/StorefrontPage.tsx";
import { KustomizerPage } from "@/features/kustomizer/KustomizerPage.tsx";
import { VariationsPage } from "@/features/kustomizer/VariationsPage.tsx";
import { AdminPage } from "@/features/admin/AdminPage.tsx";

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
          <Route path="admin_k9x7m" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
