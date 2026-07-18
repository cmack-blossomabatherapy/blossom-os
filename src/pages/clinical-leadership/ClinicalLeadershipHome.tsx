import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users, ShieldAlert, ClipboardCheck, ClipboardList, FileCheck2,
  Users2, Gauge, LifeBuoy, GraduationCap,
} from "lucide-react";

const CENTERS = [
  { path: "bcba-workforce",   title: "BCBA Workforce",              desc: "Active roster, lifecycle, credentials, learning, leave, growth interest.", Icon: Users },
  { path: "caseload-risk",    title: "Caseload Risk",               desc: "Auth risk, staffing risk, utilization, cancellations, on-hold cases.",     Icon: ShieldAlert },
  { path: "rbt-supervision",  title: "RBT Supervision",             desc: "Requirement vs completed, observation status, follow-ups.",                 Icon: ClipboardCheck },
  { path: "assessment-qa",    title: "Assessment & QA",             desc: "Assessments open, treatment plans, QA returns, overdue corrections.",       Icon: ClipboardList },
  { path: "progress-auth",    title: "Progress Report & Auth",      desc: "PR milestones, auth expirations, submission readiness.",                    Icon: FileCheck2 },
  { path: "parent-training",  title: "Parent Training & Utilization", desc: "PT delivery vs requirement, utilization drivers, on-hold reasons.",       Icon: Users2 },
  { path: "capacity",         title: "BCBA Capacity",               desc: "Available, approaching, at, over. 30-day projected load and backlog.",      Icon: Gauge },
  { path: "support",          title: "Clinical Support",            desc: "Open support requests, SLA aging, ownership by category.",                  Icon: LifeBuoy },
  { path: "fellowship",       title: "Fellowship Supervision",      desc: "Fellows by stage, upcoming reviews, at-risk fellows.",                      Icon: GraduationCap },
];

export default function ClinicalLeadershipHome() {
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Clinical Leadership</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Focused command centers for clinical operations. Every view leads to action, not analytics.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CENTERS.map(({ path, title, desc, Icon }) => (
          <Link key={path} to={`/clinical-leadership/${path}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 text-primary p-2"><Icon className="h-5 w-5" /></div>
                  <div>
                    <div className="font-medium">{title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{desc}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}