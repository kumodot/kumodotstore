import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./Layout.tsx";
import { StorefrontPage } from "@/features/storefront/StorefrontPage.tsx";
import { KustomizerPage } from "@/features/kustomizer/KustomizerPage.tsx";
import { VariationsPage } from "@/features/kustomizer/VariationsPage.tsx";
import { AdminPage } from "@/features/admin/AdminPage.tsx";
import { DEFAULT_MODEL_ID } from "@/data/caseModels.ts";

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<StorefrontPage />} />
          <Route
            path="kustomize"
            element={<Navigate to={DEFAULT_MODEL_ID} replace />}
          />
          <Route path="kustomize/:modelId" element={<KustomizerPage />} />
          <Route path="configure/:configId" element={<VariationsPage />} />
          <Route path="admin_k9x7m" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
