import { Link } from "react-router-dom";
import {
  Users, GraduationCap, Megaphone, Stethoscope, ShieldCheck, Phone, Wrench,
  ArrowUpRight, type LucideIcon,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Card } from "@/components/ui/card";

interface HomeCard {
  title: string;
  body: string;
  icon: LucideIcon;
  to: string;
}

const CARDS: HomeCard[] = [
  { title: "People and Access",      body: "Manage users, roles, logins, devices, badges, and permissions.",                 icon: Users,        to: "/user-management" },
  { title: "Training and Resources", body: "Centralize training paths, SOPs, policies, forms, scripts, and role resources.", icon: GraduationCap, to: "/academy" },
  { title: "Growth and Admissions",  body: "Track referrals, leads, campaigns, calls, intake, and the patient journey.",    icon: Megaphone,    to: "/marketing" },
  { title: "Clinical and Quality",   body: "Monitor evaluations, documentation, compliance, supervision, and clinical readiness.", icon: Stethoscope, to: "/ops/qa" },
  { title: "Operations",             body: "Organize authorizations, denials, scheduling, staffing, state health, and case movement.", icon: ShieldCheck, to: "/state-operations" },
  { title: "Communications",         body: "Centralize phone activity, call logs, shared lines, requests, and activity history.",     icon: Phone, to: "/phone" },
  { title: "System Tools",           body: "Track workflows, requests, issues, integrations, and system settings.",                   icon: Wrench, to: "/system/workflow-inventory" },
];

export default function BlossomOSHome() {
  return (
    <OSShell>
      <div className="px-6 lg:px-10 py-12 max-w-[1400px] mx-auto space-y-10">
        <header className="max-w-3xl">
          <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Blossom OS</div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">Blossom OS Command Center</h1>
          <p className="text-base text-muted-foreground mt-3">
            A clean operating system for Blossom ABA Therapy, built around role clarity, training, resources,
            reports, patient journey visibility, people access, communications, and operational execution.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {CARDS.map((c) => (
            <Link
              key={c.title}
              to={c.to}
              className="group rounded-2xl border border-border/70 bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-border shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center">
                  <c.icon className="h-5 w-5 text-primary" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight">{c.title}</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{c.body}</p>
            </Link>
          ))}
        </div>
      </div>
    </OSShell>
  );
}
