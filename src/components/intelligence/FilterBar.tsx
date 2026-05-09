import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

interface Props {
  showState?: boolean;
  showDept?: boolean;
  showRole?: boolean;
  showRange?: boolean;
}

export function FilterBar({ showState = true, showDept = true, showRole = false, showRange = true }: Props) {
  return (
    <Card className="flex flex-wrap items-center gap-2 p-3">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mr-1">Filters</span>
      {showRange && (
        <Select defaultValue="30d"><SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="qtd">Quarter to date</SelectItem>
            <SelectItem value="ytd">Year to date</SelectItem>
          </SelectContent>
        </Select>
      )}
      {showDept && (
        <Select defaultValue="all"><SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            <SelectItem value="intake">Intake</SelectItem>
            <SelectItem value="auth">Authorizations</SelectItem>
            <SelectItem value="qa">QA</SelectItem>
            <SelectItem value="staffing">Staffing</SelectItem>
            <SelectItem value="clinics">Clinics</SelectItem>
            <SelectItem value="hr">HR</SelectItem>
          </SelectContent>
        </Select>
      )}
      {showState && (
        <Select defaultValue="all"><SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            <SelectItem value="GA">Georgia</SelectItem>
            <SelectItem value="NC">North Carolina</SelectItem>
            <SelectItem value="TN">Tennessee</SelectItem>
            <SelectItem value="VA">Virginia</SelectItem>
            <SelectItem value="MD">Maryland</SelectItem>
          </SelectContent>
        </Select>
      )}
      {showRole && (
        <Select defaultValue="all"><SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="rbt">RBT</SelectItem>
            <SelectItem value="bcba">BCBA</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="director">Director</SelectItem>
          </SelectContent>
        </Select>
      )}
    </Card>
  );
}
