"use client";

import { useRouter } from "next/navigation";
import Header from "@/components/header/Header";
import HeroSection from "@/components/hero/HeroSection";
import HowItWorks from "@/components/features/HowItWorks";
import SocialProof from "@/components/social/SocialProof";
import FeaturePreview from "@/components/features/FeaturePreview";
import OnboardingForm from "@/components/onboarding/OnboardingForm";
import { useUiStore } from "@/lib/store/useUiStore";
import { useOnboardingStore } from "@/lib/store/useOnboardingStore";
import { isOnboardingComplete } from "@/lib/onboarding";

export default function Home() {
  const openForm = useUiStore((s) => s.openForm);
  const onboarding = useOnboardingStore();
  const router = useRouter();
  const complete = isOnboardingComplete(onboarding);

  const handleStart = () => {
    if (complete) {
      router.push("/dashboard");
    } else {
      openForm();
    }
  };

  return (
    <>
      <Header />
      <main className="relative">
        <HeroSection onStart={handleStart} />
        <HowItWorks />
        <SocialProof />
        <FeaturePreview />
      </main>
      <OnboardingForm />
    </>
  );
}