import { useState } from "react";
import { Users as UsersIcon, Search, Award, GraduationCap, Activity, Download } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { blossomUsers, type BlossomUser } from "@/data/blossomOS";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function BlossomUsers() {
  const { isAdmin } = useAuth();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<BlossomUser | null>(null);
  const filtered = blossomUsers.filter((u) =>
    !q || [u.name, u.email, u.role, u.department, u.location].some((f) => f.toLowerCase().includes(q.toLowerCase()))
  );

  const statusTone = (s: BlossomUser["trainingStatus"]) =>
    s === "Complete" ? "bg-success/15 text-success" : s === "Behind" ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary";

  return (
    <GlassPageShell
      eyebrow="Users"
      eyebrowIcon={UsersIcon}
      title="People & training records"
      description="Every Blossom team member with their assignments, certifications, competencies, and training status."
      actions={isAdmin ? <Button size="sm" variant="outline"><Download className="h-4 w-4" /> Export Report</Button> : null}
    >
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search name, role, department…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <span className="text-xs text-muted-foreground">{filtered.length} users</span>
        </div>
      </Card>

      <Card className="mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Role</TableHead>
                <TableHead className="hidden md:table-cell">Department</TableHead>
                <TableHead className="hidden lg:table-cell">Location</TableHead>
                <TableHead className="text-center">Tracks</TableHead>
                <TableHead className="text-center">Courses</TableHead>
                <TableHead className="text-center">Certs</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelected(u)}>
                  <TableCell>
                    <div className="font-medium text-foreground">{u.name}</div>
                    <div className="text-[11px] text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{u.role}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{u.department}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{u.location}</TableCell>
                  <TableCell className="text-center text-sm">{u.assignedTracks}</TableCell>
                  <TableCell className="text-center text-sm">{u.completedCourses}/{u.assignedCourses}</TableCell>
                  <TableCell className="text-center text-sm">{u.certifications}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${statusTone(u.trainingStatus)}`}>
                      {u.trainingStatus}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <p className="text-xs text-muted-foreground">{selected.email} · {selected.role}</p>
              </SheetHeader>
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <Field label="Department" value={selected.department} />
                  <Field label="State" value={selected.state} />
                  <Field label="Location" value={selected.location} />
                  <Field label="Manager" value={selected.manager} />
                  <Field label="Status" value={selected.status} />
                  <Field label="Last active" value={selected.lastActive} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Stat icon={GraduationCap} label="Tracks" value={selected.assignedTracks} />
                  <Stat icon={Activity} label="Courses" value={`${selected.completedCourses}/${selected.assignedCourses}`} />
                  <Stat icon={Award} label="Certs" value={selected.certifications} />
                </div>
                {isAdmin && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button size="sm" variant="outline">Assign Track</Button>
                    <Button size="sm" variant="outline">Assign Course</Button>
                    <Button size="sm" variant="outline">View Certificates</Button>
                    <Button size="sm" variant="outline">Course Activity</Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </GlassPageShell>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <Icon className="mx-auto mb-1 h-4 w-4 text-primary" />
      <div className="text-base font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
