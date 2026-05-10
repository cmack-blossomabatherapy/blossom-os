import { useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { SettingsNav } from "@/components/settings/SettingsNav";
import { GeneralSettingsPanel } from "@/components/settings/GeneralSettingsPanel";
import { StatesPanel } from "@/components/settings/StatesPanel";
import { ClinicsPanel } from "@/components/settings/ClinicsPanel";
import { PayorsPanel } from "@/components/settings/PayorsPanel";
import { PipelinePanel } from "@/components/settings/PipelinePanel";
import { TaskTemplatesPanel } from "@/components/settings/TaskTemplatesPanel";
import { AutomationRulesPanel } from "@/components/settings/AutomationRulesPanel";
import { RolesPanel } from "@/components/settings/RolesPanel";
import { AssignmentRulesPanel } from "@/components/settings/AssignmentRulesPanel";
import { TemplatesPanel } from "@/components/settings/TemplatesPanel";
import { DocumentTypesPanel } from "@/components/settings/DocumentTypesPanel";
import { IntegrationsPanel } from "@/components/settings/IntegrationsPanel";
import { AuditLogsPanel } from "@/components/settings/AuditLogsPanel";
import { SopRankingPanel } from "@/components/settings/SopRankingPanel";
import { PushNotificationsPanel } from "@/components/settings/PushNotificationsPanel";
import { AlertAuditLogPanel } from "@/components/settings/AlertAuditLogPanel";
import { AlertSlaPanel } from "@/components/settings/AlertSlaPanel";
import { OnboardingAllowlistPanel } from "@/components/settings/OnboardingAllowlistPanel";
import type { SettingsSectionId } from "@/data/settings";

export default function SettingsPage() {
  const [active, setActive] = useState<SettingsSectionId>("general");

  return (
    <GlassPageShell
      eyebrow="Academy Settings"
      eyebrowIcon={SettingsIcon}
      title="Configure Blossom"
      description="States, pipelines, roles, automations, integrations — everything that powers the platform."
    >
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4 items-start">
        <SettingsNav active={active} onSelect={setActive} />
        <div className="min-w-0">
          {active === "general" && <GeneralSettingsPanel />}
          {active === "states" && <StatesPanel />}
          {active === "clinics" && <ClinicsPanel />}
          {active === "payors" && <PayorsPanel />}
          {active === "pipeline" && <PipelinePanel />}
          {active === "task-templates" && <TaskTemplatesPanel />}
          {active === "automation-rules" && <AutomationRulesPanel />}
          {active === "roles" && <RolesPanel />}
          {active === "assignment-rules" && <AssignmentRulesPanel />}
          {active === "onboarding-allowlist" && <OnboardingAllowlistPanel />}
          {active === "email-templates" && <TemplatesPanel channel="Email" />}
          {active === "sms-templates" && <TemplatesPanel channel="SMS" />}
          {active === "document-types" && <DocumentTypesPanel />}
          {active === "integrations" && <IntegrationsPanel />}
          {active === "search-ranking" && <SopRankingPanel />}
          {active === "push-notifications" && <PushNotificationsPanel />}
          {active === "alert-audit" && <AlertAuditLogPanel />}
          {active === "alert-sla" && <AlertSlaPanel />}
          {active === "audit-logs" && <AuditLogsPanel />}
        </div>
      </div>
    </GlassPageShell>
  );
}
