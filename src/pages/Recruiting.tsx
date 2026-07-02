import { Navigate } from "react-router-dom";

// Legacy demo page — kept only as a redirect shim to the real Recruiting OS workspace.
export default function Recruiting() {
  return <Navigate to="/recruiting/workspace" replace />;
}
