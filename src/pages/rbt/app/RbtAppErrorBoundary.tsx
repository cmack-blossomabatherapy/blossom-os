import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

interface Props { children: ReactNode }
interface State { error: Error | null }

export class RbtAppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[RBT app]", error, info?.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto max-w-md pt-6">
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-amber-500/10 p-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" aria-hidden />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">We couldn't load this page</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Something went wrong on our side. Try again — if this keeps happening, tap Support to let us know.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => { this.reset(); window.location.reload(); }}
                  className="rounded-xl bg-primary px-4 h-10 text-sm font-medium text-primary-foreground"
                >
                  Reload
                </button>
                <Link
                  to="/rbt/app/home"
                  onClick={this.reset}
                  className="rounded-xl border border-border px-4 h-10 inline-flex items-center text-sm font-medium text-foreground hover:bg-muted/50"
                >
                  Go home
                </Link>
                <Link
                  to="/rbt/app/support"
                  onClick={this.reset}
                  className="rounded-xl border border-border px-4 h-10 inline-flex items-center text-sm font-medium text-foreground hover:bg-muted/50"
                >
                  Get support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default RbtAppErrorBoundary;