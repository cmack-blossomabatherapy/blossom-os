import { useCallback, useEffect, useMemo, useState } from "react";
import { OSShell } from "@/pages/os/OSShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MonitorSmartphone, Tablet, Wifi, Laptop, Smartphone, Plus, Search, MoreHorizontal, Archive, Trash2, Pencil, UserPlus, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useOSRole } from "@/contexts/OSRoleContext";
import { Navigate } from "react-router-dom";

type Device = {
  id: string;
  device_type: string;
  name: string;
  serial: string | null;
  status: string; // available | assigned | retired
  notes: string | null;
  created_at: string;
};

type Assignment = {
  id: string;
  inventory_id: string | null;
  employee_id: string;
  status: string; // active | returned
  assigned_at: string;
};

type EmployeeLite = { id: string; first_name: string | null; last_name: string | null; email: string | null };

function empName(e: EmployeeLite | undefined): string {
  if (!e) return "";
  const n = [e.first_name, e.last_name].filter(Boolean).join(" ").trim();
  return n || e.email || "";
}

const TYPE_LABEL: Record<string, string> = {
  tablet: "Tablet", hotspot: "Hotspot", laptop: "Laptop", phone: "Phone", other: "Other",
};

function deviceIcon(type: string) {
  if (type === "tablet") return Tablet;
  if (type === "hotspot") return Wifi;
  if (type === "laptop") return Laptop;
  if (type === "phone") return Smartphone;
  return MonitorSmartphone;
}

function statusTone(s: string): "ok" | "warn" | "muted" | "default" {
  if (s === "available") return "ok";
  if (s === "assigned") return "default";
  if (s === "retired") return "muted";
  return "default";
}

function StatusBadge({ status }: { status: string }) {
  const tone = statusTone(status);
  const cls =
    tone === "ok" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300"
      : tone === "muted" ? "bg-muted text-muted-foreground border-border"
      : tone === "warn" ? "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300"
      : "bg-primary/10 text-primary border-primary/30";
  return <Badge variant="outline" className={cn("capitalize", cls)}>{status}</Badge>;
}

export default function DeviceInventory() {
  const { role } = useOSRole();
  const [devices, setDevices] = useState<Device[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // dialogs
  const [openAdd, setOpenAdd] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null);
  const [assigning, setAssigning] = useState<Device | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: inv }, { data: ad }] = await Promise.all([
      supabase.from("device_inventory").select("*").order("created_at", { ascending: false }),
      supabase.from("employee_devices").select("id,inventory_id,employee_id,status,assigned_at"),
    ]);
    setDevices((inv ?? []) as Device[]);
    setAssignments((ad ?? []) as Assignment[]);

    const empIds = Array.from(new Set((ad ?? []).map((a: any) => a.employee_id)));
    if (empIds.length) {
      const { data: emps } = await supabase
        .from("employees")
        .select("id,first_name,last_name,email")
        .in("id", empIds);
      setEmployees((emps ?? []) as EmployeeLite[]);
    } else {
      setEmployees([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const activeAssignmentByDevice = useMemo(() => {
    const m = new Map<string, Assignment>();
    for (const a of assignments) {
      if (a.status !== "returned" && a.inventory_id) m.set(a.inventory_id, a);
    }
    return m;
  }, [assignments]);

  const empById = useMemo(() => {
    const m = new Map<string, EmployeeLite>();
    for (const e of employees) m.set(e.id, e);
    return m;
  }, [employees]);

  const derived = useMemo(() => {
    return devices.map((d) => {
      const a = activeAssignmentByDevice.get(d.id);
      const effectiveStatus = d.status === "retired" ? "retired" : (a ? "assigned" : "available");
      const assignee = a ? empById.get(a.employee_id) : undefined;
      return { d, a, effectiveStatus, assignee };
    });
  }, [devices, activeAssignmentByDevice, empById]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return derived.filter(({ d, effectiveStatus, assignee }) => {
      if (typeFilter !== "all" && d.device_type !== typeFilter) return false;
      if (statusFilter !== "all" && effectiveStatus !== statusFilter) return false;
      if (!needle) return true;
      return (
        d.name.toLowerCase().includes(needle) ||
        (d.serial ?? "").toLowerCase().includes(needle) ||
        empName(assignee).toLowerCase().includes(needle) ||
        (assignee?.email ?? "").toLowerCase().includes(needle)
      );
    });
  }, [derived, q, typeFilter, statusFilter]);

  const kpis = useMemo(() => {
    let total = 0, assigned = 0, available = 0, retired = 0;
    for (const x of derived) {
      total++;
      if (x.effectiveStatus === "assigned") assigned++;
      else if (x.effectiveStatus === "available") available++;
      else if (x.effectiveStatus === "retired") retired++;
    }
    return { total, assigned, available, retired };
  }, [derived]);

  async function retire(d: Device) {
    const { error } = await supabase.from("device_inventory").update({ status: "retired" }).eq("id", d.id);
    if (error) return toast.error(error.message);
    toast.success("Device retired"); void load();
  }
  async function unretire(d: Device) {
    const { error } = await supabase.from("device_inventory").update({ status: "available" }).eq("id", d.id);
    if (error) return toast.error(error.message);
    toast.success("Device restored"); void load();
  }
  async function remove(d: Device) {
    if (!confirm(`Delete ${d.name}? This cannot be undone.`)) return;
    const { error } = await supabase.from("device_inventory").delete().eq("id", d.id);
    if (error) return toast.error(error.message);
    toast("Device deleted"); void load();
  }
  async function unassign(a: Assignment) {
    const { error } = await supabase.from("employee_devices").update({
      status: "returned", returned_at: new Date().toISOString(),
    }).eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success("Marked returned"); void load();
  }

  if (role !== "super_admin" && role !== "hr_team") {
    return <Navigate to="/" replace />;
  }

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Device Inventory</h1>
            <p className="text-sm text-muted-foreground">
              Manage every tablet, hotspot, laptop, and phone owned by Blossom. Assignments here power the Assign Device action in User Management.
            </p>
          </div>
          <Button onClick={() => setOpenAdd(true)}><Plus className="size-4" /> Add device</Button>
        </header>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiTile label="Total" value={kpis.total} />
          <KpiTile label="Assigned" value={kpis.assigned} accent="primary" />
          <KpiTile label="Available" value={kpis.available} accent="ok" />
          <KpiTile label="Retired" value={kpis.retired} accent="muted" />
        </div>

        <Card className="p-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, serial, or assignee" className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {Object.entries(TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-lg border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Serial</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned to</TableHead>
                  <TableHead className="w-[56px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Loading…</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No devices match your filters. <button onClick={() => setOpenAdd(true)} className="text-primary underline-offset-2 hover:underline">Add the first device</button>.
                  </TableCell></TableRow>
                ) : filtered.map(({ d, a, effectiveStatus, assignee }) => {
                  const Icon = deviceIcon(d.device_type);
                  return (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="grid size-8 place-items-center rounded-md bg-muted text-muted-foreground"><Icon className="size-4" /></span>
                          <div>
                            <div className="font-medium">{d.name}</div>
                            {d.notes && <div className="text-xs text-muted-foreground line-clamp-1">{d.notes}</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize text-sm">{TYPE_LABEL[d.device_type] ?? d.device_type}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{d.serial ?? "—"}</TableCell>
                      <TableCell><StatusBadge status={effectiveStatus} /></TableCell>
                      <TableCell className="text-sm">
                        {assignee ? (
                          <a href={`/user-management/${assignee.id}`} className="text-primary hover:underline">
                            {empName(assignee) || "Unknown"}
                          </a>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="size-8 p-0"><MoreHorizontal className="size-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditing(d)}><Pencil className="size-3.5" /> Edit</DropdownMenuItem>
                            {effectiveStatus === "available" && (
                              <DropdownMenuItem onClick={() => setAssigning(d)}><UserPlus className="size-3.5" /> Assign to employee</DropdownMenuItem>
                            )}
                            {a && (
                              <DropdownMenuItem onClick={() => unassign(a)}><RotateCcw className="size-3.5" /> Mark returned</DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {d.status === "retired" ? (
                              <DropdownMenuItem onClick={() => unretire(d)}><RotateCcw className="size-3.5" /> Restore</DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => retire(d)}><Archive className="size-3.5" /> Retire</DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => remove(d)} className="text-destructive focus:text-destructive"><Trash2 className="size-3.5" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <DeviceFormDialog
        open={openAdd}
        onOpenChange={setOpenAdd}
        onSaved={() => { setOpenAdd(false); void load(); }}
      />
      <DeviceFormDialog
        open={!!editing}
        device={editing ?? undefined}
        onOpenChange={(v) => !v && setEditing(null)}
        onSaved={() => { setEditing(null); void load(); }}
      />
      <AssignDialog
        device={assigning}
        onOpenChange={(v) => !v && setAssigning(null)}
        onSaved={() => { setAssigning(null); void load(); }}
      />
    </OSShell>
  );
}

function KpiTile({ label, value, accent }: { label: string; value: number; accent?: "primary" | "ok" | "muted" }) {
  const cls = accent === "ok" ? "text-emerald-600 dark:text-emerald-400"
    : accent === "primary" ? "text-primary"
    : accent === "muted" ? "text-muted-foreground"
    : "text-foreground";
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold tabular-nums", cls)}>{value}</div>
    </Card>
  );
}

function DeviceFormDialog({ open, onOpenChange, device, onSaved }: {
  open: boolean; onOpenChange: (v: boolean) => void; device?: Device; onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("tablet");
  const [serial, setSerial] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(device?.name ?? "");
      setType(device?.device_type ?? "tablet");
      setSerial(device?.serial ?? "");
      setNotes(device?.notes ?? "");
    }
  }, [open, device]);

  async function save() {
    if (!name.trim()) return toast.error("Device name required");
    setBusy(true);
    const payload = { name: name.trim(), device_type: type, serial: serial.trim() || null, notes: notes.trim() || null };
    const { error } = device
      ? await supabase.from("device_inventory").update(payload).eq("id", device.id)
      : await supabase.from("device_inventory").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(device ? "Device updated" : "Device added");
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{device ? "Edit device" : "Add device"}</DialogTitle>
          <DialogDescription>Devices added here appear in the Assign Device picker on every employee profile.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. iPad Air 5 — Cart A" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Serial</label>
              <Input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={busy}>{device ? "Save" : "Add device"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignDialog({ device, onOpenChange, onSaved }: {
  device: Device | null; onOpenChange: (v: boolean) => void; onSaved: () => void;
}) {
  const [emps, setEmps] = useState<EmployeeLite[]>([]);
  const [empId, setEmpId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!device) return;
    setEmpId("");
    void supabase
      .from("employees")
      .select("id,first_name,last_name,email")
      .order("first_name")
      .limit(500)
      .then(({ data }) => setEmps((data ?? []) as EmployeeLite[]));
  }, [device]);

  async function assign() {
    if (!device || !empId) return toast.error("Pick an employee");
    setBusy(true);
    const { error } = await supabase.from("employee_devices").insert({
      employee_id: empId,
      inventory_id: device.id,
      device_type: device.device_type,
      name: device.name,
      serial: device.serial,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Device assigned");
    onSaved();
  }

  return (
    <Dialog open={!!device} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign {device?.name}</DialogTitle>
          <DialogDescription>Issue this device to an employee. It will appear on their profile's Devices tab.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Employee</label>
          <Select value={empId} onValueChange={setEmpId}>
            <SelectTrigger><SelectValue placeholder="Select an employee" /></SelectTrigger>
            <SelectContent>
              {emps.map((e) => (
                <SelectItem key={e.id} value={e.id}>{empName(e) || e.id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={assign} disabled={busy || !empId}>Assign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}