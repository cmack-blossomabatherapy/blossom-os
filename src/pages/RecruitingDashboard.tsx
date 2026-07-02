import { Navigate } from "react-router-dom";

// Legacy demo dashboard — redirect to the real Recruiting OS workspace.
export default function RecruitingDashboard() {
  return <Navigate to="/recruiting/workspace" replace />;
}
