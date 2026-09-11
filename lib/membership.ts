export const membership = {
  name: "Okuhle+",
  monthlyPrice: 150,
  /** First billing cycle is half price as a joining incentive. */
  firstMonthPrice: 75,
  currency: "ZAR",
  benefits: [
    "15–25% off every piece, applied automatically",
    "48-hour early access to new drops",
    "Rewards points — R100 spent = 1 point, 10 points = R10 off",
    "Extra 15% off during your birthday month",
    "Members' community access",
  ],
  rewards: {
    randPerPoint: 100,
    pointValueRand: 1,
    /** 10 points redeem for R10 off. */
    redeemPoints: 10,
    redeemValueRand: 10,
  },
  birthdayBonusPercent: 15,
  earlyAccessHours: 48,
} as const;
