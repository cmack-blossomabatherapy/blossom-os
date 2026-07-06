import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";

// Local typed wrapper for the beta `supabase.auth.oauth` namespace so
// TypeScript stops complaining while we call the OAuth 2.1 server methods.
type OAuthDetails = {
  client?: { name?: string; client_name?: string; logo_uri?: string };
  redirect_url?: string;
  redirect_to?: string;
  scopes?: string[];
};
type OAuthResp<T> = { data: T | null; error: { message: string } | null };
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResp<OAuthDetails>>;
  approveAuthorization: (id: string) => Promise<OAuthResp<OAuthDetails>>;
  denyAuthorization: (id: string) => Promise<OAuthResp<OAuthDetails>>;
};
const oauthApi = (): OAuthApi | null => {
  const anyAuth = (supabase as unknown as { auth: { oauth?: OAuthApi } }).auth;
  return anyAuth.oauth ?? null;
};

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const location = useLocation();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<OAuthDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        // ProtectedRoute wraps this page too, but keep this as a defensive
        // second bounce with the FULL consent URL preserved via router state.
        window.location.href =
          "/auth?next=" +
          encodeURIComponent(location.pathname + location.search);
        return;
      }
      const api = oauthApi();
      if (!api) {
        setError(
          "This project's auth server does not expose OAuth 2.1 methods yet. Please contact support.",
        );
        return;
      }
      const { data, error } = await api.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId, location.pathname, location.search]);

  async function decide(approve: boolean) {
    const api = oauthApi();
    if (!api) return;
    setBusy(true);
    const { data, error } = approve
      ? await api.approveAuthorization(authorizationId)
      : await api.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const clientName =
    details?.client?.name ?? details?.client?.client_name ?? "an app";

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f6f8fb] p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#2d8a9e]/10 text-[#2d8a9e]">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h1
          className="text-2xl font-semibold tracking-tight text-[#0c2340]"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          Connect {clientName} to Blossom OS
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Approving lets <strong>{clientName}</strong> use Blossom OS tools as
          you. It will only see data you already have access to.
        </p>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {!details && !error && (
          <div className="mt-8 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading authorization request…
          </div>
        )}

        {details && !error && (
          <div className="mt-8 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              disabled={busy}
              onClick={() => decide(false)}
            >
              Deny
            </Button>
            <Button
              className="flex-1 rounded-xl bg-[#2d8a9e] text-white hover:bg-[#1a4a6e]"
              disabled={busy}
              onClick={() => decide(true)}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}