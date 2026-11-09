/**
 * Single source of truth for plan limits. Billing is not active yet: every user
 * is on 'free' and the free plan is generous. When monetizing (Phase 5), adjust
 * limits here, set `users.plan` from the billing webhook, and call `limitFor`
 * before AI-heavy operations.
 */
export const PLANS = {
  free: {
    label: "Free",
    limits: {
      assessmentsPerMonth: Infinity,
      aiGradesPerMonth: Infinity,
      apiAccess: true,
    },
  },
  pro: {
    label: "Pro",
    limits: {
      assessmentsPerMonth: Infinity,
      aiGradesPerMonth: Infinity,
      apiAccess: true,
    },
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type PlanLimit = keyof (typeof PLANS)["free"]["limits"];

export const BILLING_ENABLED = process.env.NEXT_PUBLIC_BILLING_ENABLED === "true";

export function planOf(plan: string | null | undefined): PlanId {
  return plan && plan in PLANS ? (plan as PlanId) : "free";
}

export function limitFor(plan: string | null | undefined, limit: PlanLimit) {
  return PLANS[planOf(plan)].limits[limit];
}
