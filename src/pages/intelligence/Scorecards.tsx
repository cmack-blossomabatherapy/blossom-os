import { useState } from "react";
import { Trophy } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScorecardRow } from "@/components/intelligence/ScorecardRow";
import { weeklyScorecard, monthlyScorecard, departmentScorecard, leadershipScorecard } from "@/data/blossomIntelligence";

export default function Scorecards() {
  return (
    <GlassPageShell eyebrow="KPI Scorecards" eyebrowIcon={Trophy}
      title="Accountability scorecards" description="EOS-style operational scorecards across the organization.">
      <Tabs defaultValue="weekly" className="mt-2">
        <TabsList className="grid w-full grid-cols-4 max-w-md"><TabsTrigger value="weekly">Weekly</TabsTrigger><TabsTrigger value="monthly">Monthly</TabsTrigger><TabsTrigger value="dept">Department</TabsTrigger><TabsTrigger value="leadership">Leadership</TabsTrigger></TabsList>
        {[
          { v: "weekly", rows: weeklyScorecard },
          { v: "monthly", rows: monthlyScorecard },
          { v: "dept", rows: departmentScorecard },
          { v: "leadership", rows: leadershipScorecard },
        ].map((t) => (
          <TabsContent key={t.v} value={t.v}>
            <Card className="p-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground"><tr>
                  <th className="text-left py-2">KPI</th><th className="text-left hidden md:table-cell">Owner</th><th className="text-center hidden sm:table-cell">Target</th><th className="text-center">Current</th><th className="text-left">Trend</th>
                </tr></thead>
                <tbody>{t.rows.map((r) => <ScorecardRow key={r.id} row={r} />)}</tbody>
              </table>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </GlassPageShell>
  );
}
