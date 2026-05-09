import { useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
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
import type { SettingsSectionId } from "@/data/settings";

export default function SettingsPage() {
  const [active, setActive] = useState<SettingsSectionId>("general");

  return (
    <PageShell
      title="Settings"
      description="Admin controls — configure states, pipelines, roles, automations, and integrations"
      icon={SettingsIcon}
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
          {active === "email-templates" && <TemplatesPanel channel="Email" />}
          {active === "sms-templates" && <TemplatesPanel channel="SMS" />}
          {active === "document-types" && <DocumentTypesPanel />}
          {active === "integrations" && <IntegrationsPanel />}
          {active === "search-ranking" && <SopRankingPanel />}
          {active === "push-notifications" && <PushNotificationsPanel />}
          {active === "alert-audit" && <AlertAuditLogPanel />}
          {active === "audit-logs" && <AuditLogsPanel />}
        </div>
      </div>
    </PageShell>
  );
}
