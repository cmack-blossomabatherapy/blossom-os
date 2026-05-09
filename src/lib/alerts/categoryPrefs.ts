import { useEffect, useState, useCallback } from "react";
import type { AlertCategory } from "@/hooks/useMobileAlerts";

export const ALERT_CATEGORIES: AlertCategory[] = ["task", "approval", "overdue", "compliance"];

export const ALERT_CATEGORY_META: Record<AlertCategory, { label: string; description: string }> = {
  task:       { label: "Tasks",       description: "Open client and intake tasks assigned to you." },
  approval:   { label: "Approvals",   description: "Items waiting for review or release (payroll, requests)." },
  overdue:    { label: "Overdue",     description: "Authorizations expiring or denied, reauth at risk." },
  compliance: { label: "Compliance",  description: "Compliance flags raised on client records." },
};

const STORAGE_KEY = "alert-category-prefs";

type Prefs = Record<AlertCategory, boolean>;

const DEFAULT_PREFS: Prefs = {
  task: true,
  approval: true,
  overdue: true,
  compliance: true,
};

function load(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return DEFAULT_PREFS;
  }
}

function save(prefs: Prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent("alert-category-prefs-changed"));
  } catch {
    /* ignore */
  }
}

export function useAlertCategoryPrefs() {
  const [prefs, setPrefs] = useState<Prefs>(() => load());

  useEffect(() => {
    const handler = () => setPrefs(load());
    window.addEventListener("alert-category-prefs-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("alert-category-prefs-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const setCategory = useCallback((category: AlertCategory, enabled: boolean) => {
    setPrefs((prev) => {
      const next = { ...prev, [category]: enabled };
      save(next);
      return next;
    });
  }, []);

  const isEnabled = useCallback((category: AlertCategory) => prefs[category] !== false, [prefs]);

  return { prefs, setCategory, isEnabled };
}
