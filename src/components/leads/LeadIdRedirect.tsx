import { Navigate, useParams } from "react-router-dom";

/**
 * Export 89 — canonical /leads/:id deep-link handler.
 *
 * The legacy full-page LeadDetail used Monday-era VOB/Sent Form labels.
 * The canonical Intake lead experience lives in OSLeadsV2 + LeadDetailDrawer,
 * which auto-opens the drawer when `?lead=<id>` is present on /leads.
 */
export default function LeadIdRedirect() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/leads" replace />;
  return <Navigate to={`/leads?view=pipeline&lead=${encodeURIComponent(id)}`} replace />;
}