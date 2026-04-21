import { Badge } from "@/components/ui/badge";
import {
  TIMESHEET_STATUS_META, EXCEPTION_KIND_META, PUNCH_KIND_META,
  type TimesheetStatus, type AttendanceExceptionKind, type PunchKind,
} from "@/lib/hr/types";
import { cn } from "@/lib/utils";

export function TimesheetStatusBadge({ status }: { status: TimesheetStatus }) {
  const m = TIMESHEET_STATUS_META[status];
  return <Badge variant="outline" className={cn("text-[10px] font-medium", m.tone)}>{m.label}</Badge>;
}

export function ExceptionKindBadge({ kind }: { kind: AttendanceExceptionKind }) {
  const m = EXCEPTION_KIND_META[kind];
  return <Badge variant="outline" className={cn("text-[10px] font-medium", m.tone)}>{m.label}</Badge>;
}

export function PunchKindBadge({ kind }: { kind: PunchKind }) {
  const m = PUNCH_KIND_META[kind];
  return <Badge variant="outline" className={cn("text-[10px] font-medium", m.tone)}>{m.label}</Badge>;
}