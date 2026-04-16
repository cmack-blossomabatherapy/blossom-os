import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { OperationsControlBar } from "@/components/operations/OperationsControlBar";
import { QAQueueView } from "@/components/operations/QAQueueView";

export default function QA() {
  const [searchQuery, setSearchQuery] = useState("");
  return (
    <PageShell
      title="QA Reviews"
      description="Treatment plan review · the bridge from assessment to treatment auth"
      icon={ClipboardCheck}
    >
      <OperationsControlBar
        activeView="qa"
        onActiveViewChange={() => {}}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <QAQueueView searchQuery={searchQuery} />
    </PageShell>
  );
}
