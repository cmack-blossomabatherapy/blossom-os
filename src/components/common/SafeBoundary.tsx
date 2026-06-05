import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  label?: string;
  fallbackTitle?: string;
  retryHref?: string;
  showErrorDetails?: boolean;
}
interface State { error: Error | null }

/**
 * Calm error boundary used to keep a single panel crash from white-screening
 * the whole admin workspace (e.g. Resource Library bulk upload).
 */
export class SafeBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error("[SafeBoundary]", this.props.label ?? "panel", error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        role="alert"
        data-testid="safe-boundary-fallback"
        className="flex items-start gap-3 rounded-2xl border border-destructive/25 bg-destructive/10 p-5 text-[13px] text-foreground"
      >
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <div className="space-y-1">
          <p className="font-medium">
            {this.props.fallbackTitle ?? `${this.props.label ?? "This section"} could not load.`}
          </p>
          <p className="text-muted-foreground">
            Try refreshing the page.{" "}
            {this.props.retryHref ? (
              <a href={this.props.retryHref} className="underline">
                Reload Resource Management
              </a>
            ) : null}
          </p>
          {this.props.showErrorDetails ? (
            <p className="text-[11px] text-muted-foreground" data-testid="safe-boundary-error-detail">
              {this.state.error.message}
            </p>
          ) : null}
        </div>
      </div>
    );
  }
}

export default SafeBoundary;