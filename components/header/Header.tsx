"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useOnboardingStore } from "@/lib/store/useOnboardingStore";
import { isOnboardingComplete } from "@/lib/onboarding";

export default function Header() {
  const onboarding = useOnboardingStore();
  const complete = isOnboardingComplete(onboarding);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2.5 text-white"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] text-sm font-semibold text-accent">
            P
          </span>
          <span className="text-lg font-semibold tracking-tight">Portfolino</span>
        </button>

        {complete && (
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white/95"
          >
            Dashboard
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </header>
  );
}