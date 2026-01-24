'use client';

import { useUser } from "@clerk/nextjs";
import { useMemo, useCallback } from "react";

export type Plan = 'free' | 'pro' | 'ultra' | null;
export type PlanName = 'free' | 'pro' | 'ultra';

export const VALID_PLANS: PlanName[] = ['free', 'pro', 'ultra'];

function isPlanName(value: string): value is PlanName {
  return VALID_PLANS.includes(value as PlanName);
}

export interface UsePlanReturn {
  plan: Plan;
  hasPlan: (planName: string) => boolean;
  isFree: boolean;
  isPro: boolean;
  isUltra: boolean;
}

/**
 * Hook to check user's subscription plan from Clerk
 * 
 * Checks user's publicMetadata or privateMetadata for plan information.
 * Defaults to 'free' if user is signed in but no plan is found.
 * Returns null if user is not signed in.
 */
export function usePlan(): UsePlanReturn {
  const { user, isLoaded } = useUser();

  const plan = useMemo<Plan>(() => {
    if (!isLoaded || !user) {
      return null;
    }

    // Check publicMetadata first (commonly used for plan info)
    const publicPlan = user.publicMetadata?.plan as string | undefined;
    if (publicPlan && isPlanName(publicPlan)) {
      return publicPlan;
    }

    // If user exists but no plan found, default to free
    return 'free';
  }, [user, isLoaded]);

  const hasPlan = useCallback((planName: string): boolean => {
    if (!plan) return false;
    return plan === planName.toLowerCase();
  }, [plan]);

  return {
    plan,
    hasPlan,
    isFree: plan === 'free',
    isPro: plan === 'pro',
    isUltra: plan === 'ultra',
  };
}
