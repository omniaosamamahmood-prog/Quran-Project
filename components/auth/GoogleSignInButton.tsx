"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { supabase } from "@/lib/supabase/client";

export type GoogleAuthNotice = "cancelled" | "failed";

function GoogleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="h-5 w-5 shrink-0">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

type GoogleSignInButtonProps = {
  notice?: GoogleAuthNotice | null;
};

export function GoogleSignInButton({ notice = null }: GoogleSignInButtonProps) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<GoogleAuthNotice | null>(null);

  const shown = failure ?? notice;

  async function handleClick() {
    setFailure(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/${locale}`,
        },
      });

      if (error) {
        setLoading(false);
        setFailure("failed");
      }
    } catch {
      setLoading(false);
      setFailure("failed");
    }
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs text-muted">{t("or")}</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      {shown ? (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-red-200/80 bg-red-50 px-3 py-2 text-sm leading-relaxed text-red-800"
        >
          {shown === "cancelled" ? t("googleCancelled") : t("googleError")}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={cn(
          "mt-3 flex w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-3",
          "text-[0.95rem] font-semibold text-ink",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]",
          "transition-[background-color,border-color,opacity] hover:border-emerald/30 hover:bg-sage/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/35 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-65",
        )}
      >
        <GoogleIcon />
        {loading ? t("googleSubmitting") : t("continueWithGoogle")}
      </button>
    </div>
  );
}
