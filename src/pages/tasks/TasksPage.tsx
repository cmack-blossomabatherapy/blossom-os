import IntakeTasks from "@/pages/os/intake/IntakeTasks";

/**
 * Universal Tasks page mounted at `/tasks` for every role.
 * Renders the shared task list without the intake-only "Growth & Admissions"
 * framing or the "Add Lead" action.
 */
export default function TasksPage() {
  return <IntakeTasks variant="universal" />;
}