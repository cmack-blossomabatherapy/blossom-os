import { Component, type ReactNode } from "react";
import { useLocation, Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

interface State { error: Error | null }

class Boundary extends Component<{ children: ReactNode; resetKey: string }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // Surface to devtools; production monitoring can hook in later.
    // eslint-disable-next-line no-console
    console.error("[RouteErrorBoundary]", error, info);
  }

  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="rounded-full bg-amber-100 p-3 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">This page ran into an issue</h1>
          <p className="text-sm text-muted-foreground">
            Something on this page failed to render. The rest of Blossom OS is still available — try another
            menu item or head back to your workspace.
          </p>
          <pre className="max-h-40 max-w-full overflow-auto rounded-md bg-muted p-3 text-left text-xs">
            {String(this.state.error?.message ?? this.state.error)}
          </pre>
          <div className="flex gap-2">
            <button
              className="rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
            <Link
              to="/"
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
            >
              Go to workspace home
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  return <Boundary resetKey={location.pathname + location.search}>{children}</Boundary>;
}
