import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  BarChart3,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Compass,
  Zap,
  GraduationCap,
  Workflow,
  AlertTriangle,
  ClipboardCheck,
} from "lucide-react";
import {
  complianceItems,
  recommendations,
  simulations,
  automationTemplates,
} from "@/data/blossomEnterprise";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const enterprisePages = [
  { label: "Workforce Readiness", path: "/enterprise/readiness", icon: BarChart3 },
  { label: "Compliance & Audit", path: "/enterprise/compliance", icon: ShieldCheck },
  { label: "SOP Intelligence", path: "/enterprise/sop-intelligence", icon: BookOpen },
  { label: "Simulations", path: "/enterprise/simulations", icon: Compass },
  { label: "Automations", path: "/enterprise/automations", icon: Zap },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, compliance, recommendations, simulations…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Enterprise pages">
          {enterprisePages.map((p) => {
            const Icon = p.icon;
            return (
              <CommandItem key={p.path} value={`page ${p.label}`} onSelect={() => go(p.path)}>
                <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                {p.label}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Compliance items">
          {complianceItems.map((c) => (
            <CommandItem
              key={c.id}
              value={`compliance ${c.title} ${c.owner} ${c.category} ${c.status}`}
              onSelect={() => go("/enterprise/compliance")}
            >
              <AlertTriangle className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="truncate">{c.title}</span>
              <span className="ml-auto text-xs text-muted-foreground">{c.status}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Simulations">
          {simulations.map((s) => (
            <CommandItem
              key={s.id}
              value={`simulation ${s.title} ${s.competency} ${s.category}`}
              onSelect={() => go(`/enterprise/simulations/${s.id}`)}
            >
              <ClipboardCheck className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="truncate">{s.title}</span>
              <span className="ml-auto text-xs text-muted-foreground">{s.difficulty}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Automations">
          {automationTemplates.map((a) => (
            <CommandItem
              key={a.id}
              value={`automation ${a.name} ${a.department} ${a.trigger}`}
              onSelect={() => go("/enterprise/automations")}
            >
              <Workflow className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="truncate">{a.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{a.department}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return { open, setOpen };
}