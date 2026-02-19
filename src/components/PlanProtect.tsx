'use client';

import { type ReactNode, useCallback } from 'react';
import { usePlan } from '@/hooks/use-plan';

interface PlanProtectProps {
  /**
   * Condition function that receives a `has` function to check plans
   * Returns true if content should be shown
   */
  condition: (has: (plan: { plan: string }) => boolean) => boolean;
  /**
   * Content to render if condition is true
   */
  children: ReactNode;
  /**
   * Content to render if condition is false (optional)
   */
  fallback?: ReactNode | null;
}

/**
 * PlanProtect component that mimics Convex Protect API for plan-based conditional rendering
 *
 * Usage:
 * ```tsx
 * <PlanProtect
 *   condition={(has) => !has({ plan: "pro" }) && !has({ plan: "ultra" })}
 *   fallback={null}
 * >
 *   <Button>Upgrade to Pro</Button>
 * </PlanProtect>
 * ```
 */
export function PlanProtect({
  condition,
  children,
  fallback = null,
}: PlanProtectProps) {
  const { hasPlan } = usePlan();

  // Create a has function that matches the Convex Protect API
  const has = useCallback(
    (planObj: { plan: string }): boolean => {
      return hasPlan(planObj.plan);
    },
    [hasPlan],
  );

  // Check if condition is met
  const shouldShow = condition(has);

  if (shouldShow) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
