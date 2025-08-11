import { prisma } from '@/lib/prisma'

export async function checkUserSubscription(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      stripeSubscriptionId: true,
      stripeCurrentPeriodEnd: true,
      stripePriceId: true,
    },
  })

  if (!user) {
    return {
      isActive: false,
      plan: 'free',
    }
  }

  const isActive =
    user.stripeSubscriptionId &&
    user.stripeCurrentPeriodEnd &&
    user.stripeCurrentPeriodEnd.getTime() > Date.now()

  return {
    isActive: !!isActive,
    plan: isActive ? 'pro' : 'free',
    stripeSubscriptionId: user.stripeSubscriptionId,
    stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
    stripePriceId: user.stripePriceId,
  }
}