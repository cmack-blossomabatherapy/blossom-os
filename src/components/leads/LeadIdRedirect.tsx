import { Navigate, useParams } from "react-router-dom";

/**
 * Legacy shim retained only so historical query-shape URLs continue to
 * resolve. The canonical `/leads/:id` route is served by the full-page
 * `LeadDetail` component — the popout drawer has been retired.
 */
export default function LeadIdRedirect() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/leads" replace />;
  return <Navigate to={`/leads/${encodeURIComponent(id)}`} replace />;
}