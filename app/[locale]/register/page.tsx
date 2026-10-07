"use client";

import { FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { RegisterVisualPanel } from "@/components/auth/RegisterVisualPanel";
import { BrandMark } from "@/components/ui/BrandMark";
import { cn } from "@/lib/cn";
import { supabase } from "@/lib/supabase/client";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path
          d="M3.5 12s3.2-6 8.5-6 8.5 6 8.5 6-3.2 6-8.5 6-8.5-6-8.5-6Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M4 4.5 20 19.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9.2 9.4A3.5 3.5 0 0 0 12 15.5c.7 0 1.3-.2 1.9-.5M6.1 6.8C4.3 8.2 3.2 10 3 12c.3 1.8 3.4 6 9 6 1.8 0 3.3-.4 4.6-1.1M14.6 9.2A3.5 3.5 0 0 1 17 12c0 .4 0 .7-.1 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const fieldClassName = cn(
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[0.95rem] text-ink",
  "placeholder:text-muted/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]",
  "outline-none transition-[border-color,box-shadow]",
  "focus:border-emerald focus:ring-2 focus:ring-emerald/20",
);

export default function RegisterPage() {
  const t = useTranslations("Register");
  const tBrand = useTranslations("Brand");
  const isArabic = useLocale() === "ar";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!fullName.trim()) {
      setError(t("errors.nameRequired"));
      return;
    }

    if (password.length < 6) {
      setError(t("errors.passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("errors.passwordMismatch"));
      return;
    }

    setLoading(true);

    const locale = isArabic ? "ar" : "en";

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
        emailRedirectTo: `${window.location.origin}/${locale}/login?confirmed=true`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(t("success"));

    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <main
      id="main"
      className={cn(
        "relative isolate bg-canvas",
        /* Desktop: lock to remaining viewport under navbar — no page scroll */
        "lg:h-[calc(100dvh-4.25rem)] lg:overflow-hidden",
        "min-h-[calc(100dvh-4.25rem-4.5rem)] lg:min-h-0",
      )}
    >
      <div className="grid h-full w-full lg:grid-cols-2">
        {/* Form — vertically centered; compact spacing; LTR sits right of image */}
        <section
          className={cn(
            "relative z-10 flex items-center justify-center bg-canvas px-4 py-6 sm:px-8 lg:h-full lg:overflow-y-auto lg:px-10 xl:px-14",
            !isArabic && "lg:order-2",
          )}
        >
          <div className="w-full max-w-[23.5rem]">
            <div className="mb-5 flex items-center gap-3 lg:hidden">
              <BrandMark />
              <div className="min-w-0 leading-tight">
                <p
                  className={cn(
                    "truncate font-semibold text-ink",
                    isArabic
                      ? "font-naskh text-[1.125rem]"
                      : "text-[0.9375rem] tracking-tight",
                  )}
                >
                  {tBrand("name")}
                </p>
                <p className="truncate text-[0.6875rem] tracking-wide text-muted">
                  {tBrand("secondary")}
                </p>
              </div>
            </div>

            <div className="mb-4 hidden items-center gap-2.5 lg:flex">
              <BrandMark className="h-8 w-8" />
              <p
                className={cn(
                  "font-semibold text-emerald-deep",
                  isArabic ? "font-naskh text-base" : "text-sm tracking-tight",
                )}
              >
                {tBrand("name")}
              </p>
            </div>

            <h1
              className={cn(
                "text-ink",
                isArabic
                  ? "font-naskh text-[1.55rem] font-semibold leading-snug"
                  : "font-display text-[1.45rem] font-semibold tracking-tight",
              )}
            >
              {t("title")}
            </h1>
            <p className="mt-1.5 text-[0.9rem] leading-relaxed text-muted">
              {t("subtitle")}
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <div className="space-y-1">
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-ink"
                >
                  {t("fullName")}
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder={t("fullNamePlaceholder")}
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className={fieldClassName}
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-ink"
                >
                  {t("email")}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={fieldClassName}
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-ink"
                >
                  {t("password")}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder={t("passwordPlaceholder")}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={cn(fieldClassName, "pe-11")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition-colors hover:bg-sage/70 hover:text-emerald"
                    aria-label={
                      showPassword ? t("hidePassword") : t("showPassword")
                    }
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-ink"
                >
                  {t("confirmPassword")}
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder={t("confirmPasswordPlaceholder")}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className={cn(fieldClassName, "pe-11")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition-colors hover:bg-sage/70 hover:text-emerald"
                    aria-label={
                      showConfirmPassword
                        ? t("hidePassword")
                        : t("showPassword")
                    }
                  >
                    <EyeIcon open={showConfirmPassword} />
                  </button>
                </div>
              </div>

              {error ? (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200/80 bg-red-50 px-3 py-2 text-sm leading-relaxed text-red-800"
                >
                  {error}
                </p>
              ) : null}

              {success ? (
                <p
                  role="status"
                  className="rounded-xl border border-emerald/20 bg-sage px-3 py-2 text-sm leading-relaxed text-emerald-deep"
                >
                  {success}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "mt-1 flex w-full items-center justify-center rounded-xl bg-emerald px-4 py-3",
                  "text-[0.95rem] font-semibold text-white shadow-card",
                  "transition-[background-color,opacity] hover:bg-emerald-deep",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/35 focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-65",
                )}
              >
                {loading ? t("submitting") : t("submit")}
              </button>
            </form>

            <GoogleSignInButton />

            <p className="mt-4 text-center text-sm text-muted">
              {t("hasAccount")}{" "}
              <Link
                href="/login"
                className="font-medium text-emerald transition-colors hover:text-emerald-deep"
              >
                {t("signIn")}
              </Link>
            </p>
          </div>
        </section>

        <RegisterVisualPanel
          title={t("visualTitle")}
          subtitle={t("visualDescription")}
          isArabic={isArabic}
        />
      </div>
    </main>
  );
}
