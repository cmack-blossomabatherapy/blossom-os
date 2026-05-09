import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Award, Sparkles, ArrowRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { CompletionCertificate } from "@/components/onboarding/CompletionCertificate";
import { markStepComplete } from "@/lib/onboarding/storage";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { useAuth } from "@/contexts/AuthContext";

export default function OnboardingComplete() {
  const { user } = useAuth();
  const [showCongrats, setShowCongrats] = useState(false);
  const status = useOnboardingStatus();

  useEffect(() => {
    // Trigger completion mark (idempotent) when page renders
    markStepComplete("complete");
    setShowCongrats(true);
  }, []);

  const name = (user?.user_metadata?.full_name as string | undefined) || user?.email?.split("@")[0] || "Blossom Team Member";

  return (
    <OnboardingShell
      eyebrow="Complete"
      title="You did it. Welcome to Blossom Academy."
      description="Your onboarding journey is complete. The full Academy — Training Catalog, Resource Hub, Growth Pathways, and more — is now unlocked."
      showProgress={false}
    >
      <CompletionCertificate
        name={name}
        completedAt={status.completedAt}
        certificateId={status.certificateId}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild size="lg" className="gap-2">
          <Link to="/"><Sparkles className="h-4 w-4" /> Go to Academy Home <ArrowRight className="h-4 w-4" /></Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="gap-2">
          <Link to="/catalog"><Award className="h-4 w-4" /> Browse Training Catalog</Link>
        </Button>
        <Button variant="ghost" size="lg" className="gap-2" onClick={() => window.print()}>
          <Download className="h-4 w-4" /> Save certificate
        </Button>
      </div>

      <Dialog open={showCongrats} onOpenChange={setShowCongrats}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-primary" /> Congratulations!
            </DialogTitle>
            <DialogDescription className="text-base">
              You've completed your Blossom onboarding. You're ready, supported, and set up to do meaningful work for the families we serve.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setShowCongrats(false)}>View my certificate</Button>
          </div>
        </DialogContent>
      </Dialog>
    </OnboardingShell>
  );
}