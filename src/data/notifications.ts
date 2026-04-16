import { getAllClinicMetrics, type ClinicMetrics } from "./clients-bridge";

export type NotificationLevel = "destructive" | "warning" | "info";

export interface ClinicNotification {
  id: string;
  level: NotificationLevel;
  title: string;
  description: string;
  clinicId: string;
  clinicName: string;
  timestamp: string;
  category: "Capacity" | "Staffing" | "Pending Starts" | "Stuck";
}

const minsAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

// Build notifications dynamically from current clinic metrics so they stay
// in sync with mock data and any future filtering / search.
export function buildClinicNotifications(): ClinicNotification[] {
  const all = getAllClinicMetrics();
  const out: ClinicNotification[] = [];

  all.forEach((m, idx) => {
    if (m.clinic.isPhysical && m.utilizationPct >= 95) {
      out.push({
        id: `N-cap-${m.clinic.id}`,
        level: "destructive",
        title: "Clinic at capacity",
        description: `${m.clinic.name} is at ${Math.round(m.utilizationPct)}% — pause new starts or expand`,
        clinicId: m.clinic.id,
        clinicName: m.clinic.name,
        timestamp: minsAgo(5 + idx * 2),
        category: "Capacity",
      });
    }
    if (m.staffingNeeded >= 5) {
      out.push({
        id: `N-staff-${m.clinic.id}`,
        level: "destructive",
        title: "Staffing shortage",
        description: `${m.clinic.name}: ${m.staffingNeeded} clients waiting for RBT assignment`,
        clinicId: m.clinic.id,
        clinicName: m.clinic.name,
        timestamp: minsAgo(12 + idx * 3),
        category: "Staffing",
      });
    } else if (m.staffingNeeded >= 3) {
      out.push({
        id: `N-staff-${m.clinic.id}`,
        level: "warning",
        title: "Staffing demand rising",
        description: `${m.clinic.name}: ${m.staffingNeeded} clients in Staffing Needed`,
        clinicId: m.clinic.id,
        clinicName: m.clinic.name,
        timestamp: minsAgo(20 + idx * 3),
        category: "Staffing",
      });
    }
    if (m.pendingStarts >= 5) {
      out.push({
        id: `N-pending-${m.clinic.id}`,
        level: "warning",
        title: "Pending starts piling up",
        description: `${m.clinic.name}: ${m.pendingStarts} clients in Pending Start Date`,
        clinicId: m.clinic.id,
        clinicName: m.clinic.name,
        timestamp: minsAgo(30 + idx * 4),
        category: "Pending Starts",
      });
    }
    // Stuck before staffing surfaced via clinic metrics' alerts
    const stuckAlert = m.alerts.find((a) => a.message.toLowerCase().includes("stuck"));
    if (stuckAlert) {
      out.push({
        id: `N-stuck-${m.clinic.id}`,
        level: stuckAlert.level,
        title: "Clients stuck before staffing",
        description: `${m.clinic.name}: ${stuckAlert.message}`,
        clinicId: m.clinic.id,
        clinicName: m.clinic.name,
        timestamp: minsAgo(45 + idx * 5),
        category: "Stuck",
      });
    }
  });

  // Sort by severity then recency
  const order: Record<NotificationLevel, number> = { destructive: 0, warning: 1, info: 2 };
  return out.sort((a, b) => order[a.level] - order[b.level] || a.timestamp.localeCompare(b.timestamp));
}

export function formatRelativeShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.round(hr / 24)}d`;
}

export type { ClinicMetrics };
