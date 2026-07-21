import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClients } from "@/contexts/ClientsContext";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import ClientDetail from "./ClientDetail";
import {
  isUuid,
  resolveClientByCentralReachId,
} from "@/lib/os/reporting/canonicalClientResolver";

type CanonicalRow = {
  id: string;
  centralreach_id: string | null;
  child_name: string | null;
  state: string | null;
  clinic: string | null;
  active_service_status: string | null;
  payor: string | null;
};

type ResolveState =
  | { kind: "loading" }
  | { kind: "context" } // ClientsContext has the record; render legacy ClientDetail
  | { kind: "canonical"; row: CanonicalRow }
  | { kind: "redirect"; toUuid: string }
  | { kind: "not_found"; reason: "unresolved_cr_id" | "missing_uuid" | "denied" };

/**
 * Router-level entry for `/clients/:id`. Accepts either the internal client
 * UUID or a CentralReach id and always lands the user on a useful detail
 * page. Order of precedence:
 *
 *  1. If `ClientsContext` already has the client (Monday-derived operational
 *     dataset), render the full-featured legacy `<ClientDetail />`.
 *  2. Else if the param is a UUID, fetch from `public.clients` directly
 *     (Phase 1a promoted 879 CentralReach clients into this table). Render a
 *     canonical-only detail card.
 *  3. Else treat the param as a CentralReach id and resolve via
 *     `resolveClientByCentralReachId`. Navigate to `/clients/<uuid>` on hit.
 *  4. Everything else → friendly not-found with a Back link.
 *
 * RLS on `public.clients` protects access; a denied row shows the access
 * denied state without leaking metadata.
 */
export default function ClientDetailRouter() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getClient, loading: clientsLoading } = useClients();
  const [state, setState] = useState<ResolveState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const raw = (id ?? "").trim();
      if (!raw) {
        setState({ kind: "not_found", reason: "missing_uuid" });
        return;
      }
      // 1. Legacy Monday/context data wins.
      if (getClient(raw)) {
        setState({ kind: "context" });
        return;
      }
      // Not in the operational Monday cache. Try canonical resolution.
      if (isUuid(raw)) {
        const { data, error } = await supabase
          .from("clients")
          .select(
            "id,centralreach_id,child_name,state,clinic,active_service_status,payor",
          )
          .eq("id", raw)
          .maybeSingle();
        if (cancelled) return;
        if (error) {
          setState({ kind: "not_found", reason: "denied" });
          return;
        }
        if (!data) {
          setState({ kind: "not_found", reason: "missing_uuid" });
          return;
        }
        setState({ kind: "canonical", row: data as CanonicalRow });
        return;
      }
      const uuid = await resolveClientByCentralReachId(raw);
      if (cancelled) return;
      if (uuid) {
        setState({ kind: "redirect", toUuid: uuid });
        return;
      }
      setState({ kind: "not_found", reason: "unresolved_cr_id" });
    };
    // Wait for the ClientsContext to hydrate before we decide the id isn't in
    // it — otherwise we'd flash the canonical fallback for a legitimate
    // Monday-backed client while its rows are still loading.
    if (!clientsLoading) void run();
    return () => {
      cancelled = true;
    };
  }, [id, getClient, clientsLoading]);

  if (clientsLoading || state.kind === "loading") {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading client…
      </div>
    );
  }

  if (state.kind === "context") {
    return <ClientDetail />;
  }

  if (state.kind === "redirect") {
    return <Navigate to={`/clients/${state.toUuid}`} replace />;
  }

  if (state.kind === "not_found") {
    const messages = {
      denied: {
        title: "You don't have access to this client",
        detail:
          "This record is protected by role-scoped permissions. Reach out to your director if you believe you should be able to see it.",
        icon: <ShieldAlert className="h-8 w-8 text-muted-foreground" />,
      },
      unresolved_cr_id: {
        title: "We couldn't find that CentralReach client",
        detail:
          "The CentralReach id in this link isn't in Blossom yet. It may not have been promoted into the canonical client list.",
        icon: null,
      },
      missing_uuid: {
        title: "Client not found",
        detail: "This client doesn't exist or has been removed.",
        icon: null,
      },
    }[state.reason];
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center px-6">
        {messages.icon}
        <p className="text-base font-medium">{messages.title}</p>
        <p className="text-sm text-muted-foreground max-w-md">
          {messages.detail}
        </p>
        <Button variant="outline" onClick={() => navigate("/clients")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Clients
        </Button>
      </div>
    );
  }

  // Canonical detail card — minimal but real, powered by public.clients + the
  // canonical session view. Used when the client exists in the promoted
  // canonical table but not in the Monday operational cache.
  const row = state.row;
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/clients")}
            className="gap-1.5 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Clients
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">
                {row.child_name ?? "Client"}
              </h1>
              <span className="text-sm text-muted-foreground font-mono">
                {row.id}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {row.clinic ?? "Clinic pending"} · {row.state ?? "State pending"}
            </p>
          </div>
        </div>
        {row.active_service_status && (
          <StatusBadge status={row.active_service_status} variant="active" />
        )}
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Canonical client record</p>
            <p className="text-xs text-muted-foreground max-w-lg">
              This client is tracked in Blossom's canonical CentralReach
              dataset. Full operational fields (staffing history, treatment
              plan, schedule blocks) will appear here once the Monday
              operational data catches up.
            </p>
          </div>
          {row.centralreach_id && (
            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground inline-flex items-center gap-1">
              CR · {row.centralreach_id}
            </span>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Payor
            </dt>
            <dd className="text-sm">{row.payor || "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Service status
            </dt>
            <dd className="text-sm">{row.active_service_status || "—"}</dd>
          </div>
        </dl>
        {row.centralreach_id && (
          <a
            href={`https://members.centralreach.com/#clients/${row.centralreach_id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            Open in CentralReach <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}