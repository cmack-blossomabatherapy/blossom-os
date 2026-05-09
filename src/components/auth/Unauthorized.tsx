import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface UnauthorizedProps {
  permission?: string;
  /** Short label for the area being protected, e.g. "Enterprise Automations". */
  area?: string;
}

export function Unauthorized({ permission, area }: UnauthorizedProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isEnterprise = location.pathname.startsWith("/enterprise");
  const label = area ?? (isEnterprise ? "this enterprise area" : "this area");

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center bg-card border border-border rounded-2xl p-8 shadow-sm">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-5">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Access restricted</h2>
        <p className="text-sm text-muted-foreground mt-2">
          You don't have permission to view {label}. If you believe this is a
          mistake, ask a Blossom admin to grant you the right role.
        </p>
        {permission && (
          <p className="text-[11px] text-muted-foreground/70 mt-4 font-mono">
            Required permission: {permission}
          </p>
        )}
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Go back
          </Button>
          <Button size="sm" asChild>
            <Link to="/">
              <Home className="h-4 w-4 mr-1.5" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}