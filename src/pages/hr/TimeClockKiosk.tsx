import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, Delete } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmployeeAvatar } from "@/components/hr/EmployeeAvatar";
import {
  PUNCH_KIND_META, employeeFullName, nextPunchKind,
  type Employee, type PunchKind, type TimeClockPunch,
} from "@/lib/hr/types";

const CLINIC_OPTIONS = ["Atlanta", "Marietta", "Augusta", "Charlotte", "Raleigh", "Nashville", "Richmond", "Baltimore"];

/**
 * Public-style kiosk page. Mounted under /hr/kiosk.
 * Permission gating happens at the route level (`hr.timeclock.kiosk`).
 * Inside the page we use PIN entry to identify the employee — no extra auth.
 */
export default function TimeClockKiosk() {
  const [clinic, setClinic] = useState<string>(() => localStorage.getItem("hr.kiosk.clinic") ?? "Atlanta");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [matched, setMatched] = useState<{ employee: Employee; latest: TimeClockPunch | null } | null>(null);
  const [now, setNow] = useState(new Date());
  const successTimer = useRef<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => { localStorage.setItem("hr.kiosk.clinic", clinic); }, [clinic]);

  const timeStr = useMemo(
    () => now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    [now],
  );
  const dateStr = useMemo(
    () => now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    [now],
  );

  function append(d: string) {
    if (matched) return;
    setPin((p) => (p.length >= 6 ? p : p + d));
  }
  function backspace() { setPin((p) => p.slice(0, -1)); }
  function clear() { setPin(""); setMatched(null); }

  async function lookup() {
    if (pin.length < 4) { toast.error("Enter your 4-digit PIN."); return; }
    setBusy(true);
    const { data: emp, error } = await supabase
      .from("employees")
      .select("*")
      .eq("kiosk_pin", pin)
      .eq("kiosk_enabled", true)
      .maybeSingle();
    if (error || !emp) {
      setBusy(false);
      toast.error("PIN not recognized. Ask your manager if this is wrong.");
      setPin("");
      return;
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const { data: latest } = await supabase
      .from("time_clock_punches")
      .select("*")
      .eq("employee_id", emp.id)
      .gte("punch_at", today.toISOString())
      .order("punch_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setMatched({ employee: emp as Employee, latest: (latest ?? null) as TimeClockPunch | null });
    setBusy(false);
  }

  async function recordPunch(kind: PunchKind) {
    if (!matched) return;
    setBusy(true);
    const { error } = await supabase.from("time_clock_punches").insert({
      employee_id: matched.employee.id,
      clinic,
      kind,
      source: "kiosk",
      status: "approved",
      punch_at: new Date().toISOString(),
    });
    setBusy(false);
    if (error) {
      toast.error("Could not save punch. Please try again.");
      return;
    }
    toast.success(`${PUNCH_KIND_META[kind].label} recorded for ${employeeFullName(matched.employee)}.`);
    if (successTimer.current) window.clearTimeout(successTimer.current);
    successTimer.current = window.setTimeout(() => clear(), 2500);
  }

  const recommendedKind = nextPunchKind(matched?.latest?.kind ?? null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/40 via-background to-background flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/40 bg-background/60 backdrop-blur-sm">
        <Link to="/hr" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Exit kiosk
        </Link>
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            className="text-xs bg-transparent border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
            value={clinic}
            onChange={(e) => setClinic(e.target.value)}
          >
            {CLINIC_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl grid md:grid-cols-2 gap-6 items-stretch">
          {/* Left: clock & instructions */}
          <Card className="p-8 flex flex-col justify-between bg-card/80">
            <div>
              <Badge variant="outline" className="mb-4 bg-primary/10 text-primary border-primary/20">
                <Clock className="h-3 w-3 mr-1" /> Clinic Kiosk
              </Badge>
              <p className="text-5xl font-semibold tabular-nums tracking-tight">{timeStr}</p>
              <p className="text-sm text-muted-foreground mt-2">{dateStr}</p>
            </div>
            <div className="text-xs text-muted-foreground/80 leading-relaxed mt-8">
              Enter your 4-digit PIN to clock in, take a break, or clock out.
              If you forget your PIN, ask a clinic lead. All punches are timestamped and reviewed by HR.
            </div>
          </Card>

          {/* Right: PIN pad or success card */}
          <Card className="p-6 flex flex-col">
            {!matched ? (
              <>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Enter PIN</p>
                <div className="my-4 flex items-center justify-center gap-2.5 h-14">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-3 w-3 rounded-full border-2 transition-colors",
                        i < pin.length ? "bg-primary border-primary" : "border-border",
                      )}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 flex-1">
                  {["1","2","3","4","5","6","7","8","9"].map((d) => (
                    <Button key={d} variant="outline" className="h-14 text-xl font-medium" onClick={() => append(d)}>
                      {d}
                    </Button>
                  ))}
                  <Button variant="ghost" className="h-14" onClick={clear}>Clear</Button>
                  <Button variant="outline" className="h-14 text-xl font-medium" onClick={() => append("0")}>0</Button>
                  <Button variant="ghost" className="h-14" onClick={backspace}><Delete className="h-5 w-5" /></Button>
                </div>
                <Button
                  className="mt-3 h-12"
                  disabled={busy || pin.length < 4}
                  onClick={lookup}
                >
                  {busy ? "Looking up…" : "Continue"}
                </Button>
              </>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <EmployeeAvatar employee={matched.employee} size="lg" />
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      Hi, {matched.employee.preferred_name || matched.employee.first_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{matched.employee.job_title}</p>
                  </div>
                </div>
                {matched.latest ? (
                  <p className="text-xs text-muted-foreground mb-3">
                    Last action today:{" "}
                    <span className="text-foreground font-medium">
                      {PUNCH_KIND_META[matched.latest.kind].label}
                    </span>{" "}
                    at {new Date(matched.latest.punch_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mb-3">No punches yet today.</p>
                )}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {(["clock_in","break_start","break_end","clock_out"] as PunchKind[]).map((k) => (
                    <Button
                      key={k}
                      variant={k === recommendedKind ? "default" : "outline"}
                      className="h-16 text-sm font-medium"
                      disabled={busy}
                      onClick={() => recordPunch(k)}
                    >
                      {PUNCH_KIND_META[k].label}
                    </Button>
                  ))}
                </div>
                <Button variant="ghost" className="mt-4" onClick={clear}>Cancel</Button>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}