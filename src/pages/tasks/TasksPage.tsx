import { Component, type ReactNode } from "react";
import IntakeTasks from "@/pages/os/intake/IntakeTasks";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

class TasksErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error("[TasksPage] render error", error); }
  render() {
    if (this.state.error) {
      return (
        <div className="px-6 lg:px-10 py-12 max-w-2xl mx-auto">
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <h2 className="text-base font-semibold tracking-tight">Tasks failed to load</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Something went wrong rendering the task list. Reload to try again.
                </p>
                <pre className="mt-3 text-[11px] text-muted-foreground bg-muted/60 rounded-lg p-2 overflow-auto max-h-40">
                  {this.state.error.message}
                </pre>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => window.location.reload()}>Reload</Button>
                  <Button size="sm" variant="outline" onClick={() => this.setState({ error: null })}>Retry</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Universal Tasks page mounted at `/tasks` for every role. The route wraps
 * this component in <OSShellPage> so the Blossom OS sidebar/topbar are always
 * present — even if the task list itself throws. `noShell` prevents
 * GrowthPageShell from mounting a second (nested) OSShell.
 */
export default function TasksPage() {
  return (
    <TasksErrorBoundary>
      <IntakeTasks variant="universal" noShell />
    </TasksErrorBoundary>
  );
}