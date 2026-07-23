import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
// Full-page migration: activity clicks navigate to /leads/:id (no drawer).
import {
  filterActivityEvents,
  getActivityColor,
  getActivityIcon,
  groupActivityByDate,
  listKnownCampaigns,
  listKnownEventTypes,
  listKnownSourceSystems,
  type ActivityEvent,
  type ActivityEventType,
  type ActivityFilters,
} from "@/lib/activity/activityTimeline";

export interface ActivityTimelineProps {
  events: ActivityEvent[];
  compact?: boolean;
  showFilters?: boolean;
  emptyMessage?: string;
  onOpenObject?: (event: ActivityEvent) => void;
  onSelect?: (event: ActivityEvent) => void;
  selectedId?: string;
  initialFilters?: ActivityFilters;
  /** When true, opens the shared Lead drawer / navigates to source event inbox
   *  automatically when a timeline item is clicked (unless onOpenObject is set). */
  enableClickThrough?: boolean;
}

function timeOf(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function ActivityTimeline({
  events,
  compact = false,
  showFilters = false,
  emptyMessage = "No activity yet.",
  onSelect,
  onOpenObject,
  selectedId,
  initialFilters,
  enableClickThrough = true,
}: ActivityTimelineProps) {
  const [search, setSearch] = useState(initialFilters?.search ?? "");
  const [eventType, setEventType] = useState<ActivityEventType | "all">(
    (initialFilters?.eventType as ActivityEventType | "all") ?? "all",
  );
  const [sourceSystem, setSourceSystem] = useState<string>(
    (initialFilters?.sourceSystem as string) ?? "all",
  );
  const [campaign, setCampaign] = useState<string>(
    (initialFilters?.campaign as string) ?? "all",
  );
  const knownSources = useMemo(() => listKnownSourceSystems(events), [events]);
  const knownCampaigns = useMemo(() => listKnownCampaigns(events), [events]);
  const knownTypes = useMemo(() => listKnownEventTypes(events), [events]);
  const navigate = useNavigate();

  const handleActivate = useCallback(
    (e: ActivityEvent) => {
      onSelect?.(e);
      if (onOpenObject) {
        onOpenObject(e);
        return;
      }
      if (!enableClickThrough) return;
      if (e.relatedLeadId) {
        navigate(`/leads/${encodeURIComponent(e.relatedLeadId)}`);
        return;
      }
      if (e.objectType === "source_event" && e.objectId) {
        navigate(`/marketing/lead-source-inbox?eventId=${e.objectId}`);
      }
    },
    [enableClickThrough, navigate, onOpenObject, onSelect],
  );

  const filtered = useMemo(
    () =>
      filterActivityEvents(events, {
        ...initialFilters,
        search,
        eventType,
        sourceSystem,
        campaign,
      }),
    [events, initialFilters, search, eventType, sourceSystem, campaign],
  );
  const groups = useMemo(() => groupActivityByDate(filtered), [filtered]);

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activity…"
              className="pl-9 h-9"
            />
          </div>
          <Select value={eventType} onValueChange={(v) => setEventType(v as ActivityEventType | "all")}>
            <SelectTrigger className="h-9 w-[170px] text-xs"><SelectValue placeholder="Event type" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All event types</SelectItem>
              {knownTypes.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">
                  {t.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceSystem} onValueChange={setSourceSystem}>
            <SelectTrigger className="h-9 w-[170px] text-xs"><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All sources</SelectItem>
              {knownSources.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={campaign} onValueChange={setCampaign}>
            <SelectTrigger className="h-9 w-[170px] text-xs"><SelectValue placeholder="Campaign" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All campaigns</SelectItem>
              {knownCampaigns.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label} className="space-y-2">
              <div className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground px-1">
                {group.label}
              </div>
              <ol className="space-y-1.5">
                {group.events.map((e) => {
                  const Icon = getActivityIcon(e.type);
                  const tone = getActivityColor(e.type, e.severity);
                  const selected = selectedId === e.id;
                  const clickable =
                    Boolean(onSelect || onOpenObject) ||
                    (enableClickThrough && (Boolean(e.relatedLeadId) || e.objectType === "source_event"));
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        disabled={!clickable}
                        onClick={() => handleActivate(e)}
                        className={cn(
                          "w-full text-left flex items-start gap-3 rounded-xl border border-border/60 bg-card px-3 py-2.5 transition-colors",
                          clickable && "hover:bg-muted/40 cursor-pointer",
                          selected && "ring-2 ring-primary/40 border-primary/40",
                          compact ? "py-2" : "py-2.5",
                        )}
                      >
                        <div className={cn("h-8 w-8 rounded-lg border grid place-items-center shrink-0", tone)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-3">
                            <div className="text-sm font-medium text-foreground truncate">{e.title}</div>
                            <div className="text-[11px] text-muted-foreground shrink-0">{timeOf(e.occurredAt)}</div>
                          </div>
                          {e.summary && !compact && (
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{e.summary}</div>
                          )}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {e.actorName && (
                              <span className="text-[11px] text-muted-foreground">
                                {e.actorName}
                                {e.actorRole ? ` · ${e.actorRole}` : ""}
                              </span>
                            )}
                            {e.sourceSystem && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                                {e.sourceSystem}
                              </Badge>
                            )}
                            {e.objectLabel && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                                {e.objectLabel}
                              </Badge>
                            )}
                            {e.severity && e.severity !== "info" && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] px-1.5 py-0 h-4 font-normal capitalize",
                                  e.severity === "critical" && "border-red-200 text-red-700 bg-red-50",
                                  e.severity === "warning" && "border-amber-200 text-amber-700 bg-amber-50",
                                  e.severity === "success" && "border-emerald-200 text-emerald-700 bg-emerald-50",
                                )}
                              >
                                {e.severity}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActivityTimeline;