export const BGR_CONFIG = {
  base: {
    newbieRating: 3200,
  },

  salesVolume: {
    logMultiplier: 900,
    quantityScale: 4,
  },

  revenue: {
    logMultiplier: 2600,
    normalizationAmount: 5000,
  },

  avgOrderValue: {
    ordersForFullWeight: 10,
    normalizationAmount: 2500,
    maxBoost: 1.6,
    power: 0.75,
  },

  rating: {
    baseMultiplier: 0.85,
    maxRating: 5,
    noRatingMultiplier: 0.9,
    consecutiveLowRatingPenalty: 0.7,
  },

  completionRate: {
    baseMultiplier: 0.6,
    maxBonus: 0.4,
  },

  limits: {
    min: 0,
    max: 35000,
  },

  penalties: {
    minDaysWithoutSales: 14,
    refundMultiplier: 200,
    maxCycleIndex: 3,

    getBaseIdlePenaltyByBgr(bgr: number) {
      if (bgr >= 10500) return 250;
      else if (bgr >= 9046) return 400;
      else if (bgr >= 6779) return 550;
      else if (bgr >= 6779) return 700;
      else if (bgr >= 4671) return 850;
      else if (bgr >= 2705) return 1000;
      return 1150;
    },
  },
} as const;
