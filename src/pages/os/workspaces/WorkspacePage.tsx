import { Navigate, useParams } from "react-router-dom";
import { WorkspaceShell } from "@/components/os/workspace/WorkspaceShell";
import { WORKSPACE_CONFIGS } from "@/lib/os/workspaceContent";

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const config = id ? WORKSPACE_CONFIGS[id] : undefined;
  if (!config) return <Navigate to="/" replace />;
  return <WorkspaceShell config={config} />;
}