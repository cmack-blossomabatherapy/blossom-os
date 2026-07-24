import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type PromptOpts = {
  title: string;
  description?: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  submitLabel?: string;
  cancelLabel?: string;
  multiline?: boolean;
  inputType?: "text" | "date";
  required?: boolean;
};

type ConfirmOpts = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type Ctx = {
  promptOperator: (opts: PromptOpts) => Promise<string | null>;
  confirmOperator: (opts: ConfirmOpts) => Promise<boolean>;
};

const OperatorDialogsCtx = createContext<Ctx | null>(null);

export function OperatorDialogsProvider({ children }: { children: React.ReactNode }) {
  const [promptState, setPromptState] = useState<
    | (PromptOpts & { resolve: (v: string | null) => void; value: string })
    | null
  >(null);
  const [confirmState, setConfirmState] = useState<
    | (ConfirmOpts & { resolve: (v: boolean) => void })
    | null
  >(null);

  const promptOperator = useCallback((opts: PromptOpts) => {
    return new Promise<string | null>((resolve) => {
      setPromptState({ ...opts, resolve, value: opts.defaultValue ?? "" });
    });
  }, []);

  const confirmOperator = useCallback((opts: ConfirmOpts) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ ...opts, resolve });
    });
  }, []);

  const value = useMemo(() => ({ promptOperator, confirmOperator }), [promptOperator, confirmOperator]);

  const closePrompt = (val: string | null) => {
    if (!promptState) return;
    promptState.resolve(val);
    setPromptState(null);
  };
  const closeConfirm = (val: boolean) => {
    if (!confirmState) return;
    confirmState.resolve(val);
    setConfirmState(null);
  };

  return (
    <OperatorDialogsCtx.Provider value={value}>
      {children}
      <Dialog open={!!promptState} onOpenChange={(o) => { if (!o) closePrompt(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{promptState?.title}</DialogTitle>
            {promptState?.description && (
              <DialogDescription>{promptState.description}</DialogDescription>
            )}
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = (promptState?.value ?? "").trim();
              if (promptState?.required && !v) return;
              closePrompt(promptState?.value ?? "");
            }}
            className="space-y-3"
          >
            {promptState?.label && <Label>{promptState.label}</Label>}
            {promptState?.multiline ? (
              <Textarea
                autoFocus
                value={promptState?.value ?? ""}
                placeholder={promptState?.placeholder}
                onChange={(e) =>
                  setPromptState((s) => (s ? { ...s, value: e.target.value } : s))
                }
                rows={4}
              />
            ) : (
              <Input
                autoFocus
                type={promptState?.inputType ?? "text"}
                value={promptState?.value ?? ""}
                placeholder={promptState?.placeholder}
                onChange={(e) =>
                  setPromptState((s) => (s ? { ...s, value: e.target.value } : s))
                }
              />
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => closePrompt(null)}>
                {promptState?.cancelLabel ?? "Cancel"}
              </Button>
              <Button type="submit">{promptState?.submitLabel ?? "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmState} onOpenChange={(o) => { if (!o) closeConfirm(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmState?.title}</DialogTitle>
            {confirmState?.description && (
              <DialogDescription>{confirmState.description}</DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => closeConfirm(false)}>
              {confirmState?.cancelLabel ?? "Cancel"}
            </Button>
            <Button
              variant={confirmState?.destructive ? "destructive" : "default"}
              onClick={() => closeConfirm(true)}
            >
              {confirmState?.confirmLabel ?? "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OperatorDialogsCtx.Provider>
  );
}

export function useOperatorDialogs(): Ctx {
  const ctx = useContext(OperatorDialogsCtx);
  if (ctx) return ctx;
  // Fallback so callers never crash if provider isn't mounted (e.g. in tests).
  // Returns non-interactive resolutions.
  const warn = (() => {
    let warned = false;
    return () => {
      if (!warned) {
        warned = true;
        // eslint-disable-next-line no-console
        console.warn("OperatorDialogsProvider is not mounted; dialog call resolved as cancelled.");
      }
    };
  })();
  return {
    promptOperator: async () => {
      warn();
      return null;
    },
    confirmOperator: async () => {
      warn();
      return false;
    },
  };
}