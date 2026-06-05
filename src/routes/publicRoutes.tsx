import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import AuthPage from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import MfaSetup from "@/pages/MfaSetup";
import MfaVerify from "@/pages/MfaVerify";
import PublicEvalFormPage from "@/pages/os/evaluations/PublicFormPage";
import NfcPublicProfile from "@/pages/nfc/NfcPublicProfile";
import MobilePermissions from "@/pages/MobilePermissions";

/**
 * Public and auth routes — no auth required, except /mobile/permissions
 * which is wrapped in ProtectedRoute (kept here because it sits with the
 * non-OS top-level routes).
 *
 * Returned as a Fragment of <Route> children so it can be spread into the
 * parent <Routes> tree without altering ordering or behavior.
 */
export const PublicRoutes = (
  <>
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/mfa/setup" element={<MfaSetup />} />
    <Route path="/mfa/verify" element={<MfaVerify />} />
    <Route path="/evaluations/form/:token" element={<PublicEvalFormPage />} />
    <Route path="/nfc/:code" element={<NfcPublicProfile />} />
    <Route path="/mobile/permissions" element={<ProtectedRoute><MobilePermissions /></ProtectedRoute>} />
  </>
);
