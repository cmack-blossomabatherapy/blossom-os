import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Compass, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isEnterprise = location.pathname.startsWith("/enterprise");

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const homeHref = isEnterprise ? "/enterprise/readiness" : "/";
  const homeLabel = isEnterprise ? "Enterprise home" : "Dashboard";

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center bg-card border border-border rounded-2xl p-8 shadow-sm">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
          <Compass className="h-7 w-7" />
        </div>
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">404</p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">
          {isEnterprise ? "Enterprise page not found" : "Page not found"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn't find{" "}
          <span className="font-mono text-foreground/80">{location.pathname}</span>.
          It may have moved or never existed.
        </p>
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Go back
          </Button>
          <Button size="sm" asChild>
            <Link to={homeHref}>
              <Home className="h-4 w-4 mr-1.5" />
              {homeLabel}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
