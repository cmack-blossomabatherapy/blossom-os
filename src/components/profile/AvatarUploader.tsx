import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  /** Owning auth user id. Used as the storage folder so the user-self RLS works. */
  ownerUserId: string;
  /** Employee row to update (optional — when omitted only auth profile is updated). */
  employeeId?: string | null;
  /** Current photo URL for preview. */
  currentUrl?: string | null;
  /** Initials shown when no photo. */
  initials: string;
  size?: "md" | "lg" | "xl";
  /** Called after a successful upload or removal with the new URL (or null). */
  onChange?: (url: string | null) => void;
  className?: string;
  /** Show the small camera badge / hover overlay. Defaults to true. */
  editable?: boolean;
  /**
   * Visual variant. "dark" (default) is the translucent-white shell used on
   * the gradient profile hero. "light" is for use on white/neutral cards
   * (e.g. the OS user-management header).
   */
  appearance?: "dark" | "light";
}

const SIZE = {
  md: "h-14 w-14 text-base",
  lg: "h-20 w-20 text-xl",
  xl: "h-24 w-24 text-2xl",
};

export function AvatarUploader({
  ownerUserId,
  employeeId,
  currentUrl,
  initials,
  size = "lg",
  onChange,
  className,
  editable = true,
  appearance = "dark",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);

  const handlePick = () => inputRef.current?.click();

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${ownerUserId}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: "3600",
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl;

      if (employeeId) {
        const { error: dbErr } = await supabase
          .from("employees")
          .update({ photo_url: url, avatar_url: url })
          .eq("id", employeeId);
        if (dbErr) throw dbErr;
      }
      // Always update the auth profile so the header dropdown / nav avatar pick it up.
      const { error: profErr } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("user_id", ownerUserId);
      if (profErr) console.warn("Could not update profile avatar_url:", profErr.message);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("profile:updated", { detail: { userId: ownerUserId, avatarUrl: url } }));
      }
      setPreview(url);
      onChange?.(url);
      toast.success("Profile photo updated");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Could not upload photo");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm("Remove profile photo?")) return;
    setBusy(true);
    try {
      if (employeeId) {
        await supabase.from("employees").update({ photo_url: null, avatar_url: null }).eq("id", employeeId);
      }
      await supabase.from("profiles").update({ avatar_url: null }).eq("user_id", ownerUserId);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("profile:updated", { detail: { userId: ownerUserId, avatarUrl: null } }));
      }
      setPreview(null);
      onChange?.(null);
      toast.success("Photo removed");
    } catch (e: any) {
      toast.error(e?.message || "Could not remove photo");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("relative shrink-0", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-2xl font-semibold backdrop-blur-xl shadow-md",
          appearance === "dark"
            ? "bg-white/10 text-white ring-1 ring-white/20"
            : "bg-muted text-muted-foreground ring-1 ring-border/60",
          SIZE[size],
        )}
      >
        {preview ? (
          <img src={preview} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-black/40">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
        {editable && !busy && (
          <button
            type="button"
            onClick={handlePick}
            aria-label="Change profile photo"
            className="absolute inset-0 grid place-items-center bg-black/0 text-transparent transition hover:bg-black/45 hover:text-white"
          >
            <Camera className="h-5 w-5" />
          </button>
        )}
      </div>

      {editable && (
        <>
          <button
            type="button"
            onClick={handlePick}
            disabled={busy}
            className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-white text-[#0F1729] shadow-md ring-2 ring-[#0F1729] hover:scale-105 transition disabled:opacity-60"
            aria-label="Upload new profile photo"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          {preview && (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="absolute -top-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-destructive shadow-sm ring-1 ring-black/10 hover:bg-white"
              aria-label="Remove profile photo"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void upload(f);
            }}
          />
        </>
      )}
    </div>
  );
}