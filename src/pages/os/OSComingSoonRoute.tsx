// Retired in Sprint 03: /coming-soon redirects to /dashboard at the App level.
// This file is preserved as a redirect-only stub for legacy imports.
import { Navigate } from "react-router-dom";

export default function OSComingSoonRoute() {
  return <Navigate to="/dashboard" replace />;
}
