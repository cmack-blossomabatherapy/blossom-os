import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export function PlaceholderTab({ title, message }: { title: string; message: string }) {
  return (
    <Card className="p-10 text-center">
      <div className="mx-auto h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
        <Sparkles className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">{message}</p>
    </Card>
  );
}