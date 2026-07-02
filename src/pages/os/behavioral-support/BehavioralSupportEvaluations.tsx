import { Navigate } from "react-router-dom";

/**
 * Behavioral Support wrapper for the shared /evaluations surface.
 * Passes ?role=behavioral_support so the shared page can scope content.
 */
export default function BehavioralSupportEvaluations() {
  return <Navigate to="/evaluations?role=behavioral_support" replace />;
}