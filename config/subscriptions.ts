export const REVENUECAT_PUBLIC_SDK_KEY = {
  google: 'REPLACE_WITH_YOUR_GOOGLE_PLAY_KEY',
  // amazon: 'REPLACE_WITH_YOUR_AMAZON_KEY', // If you want to add Amazon in future
};

export const ENTITLEMENT_ID = 'premium';

export const SUBSCRIPTION_PLANS = {
  TRIAL: {
    id: 'nutrilytics_trial',
    title: '14-Day Free Trial',
    description: 'Try all premium features free for 14 days',
    price: 'Free',
    duration: '14 days',
  },
  MONTHLY: {
    id: 'nutrilytics_monthly',
    title: 'Monthly Premium',
    description: 'Full access to all premium features',
    price: '₹199',
    priceValue: 199,
    currency: 'INR',
    duration: 'month',
  },
  YEARLY: {
    id: 'nutrilytics_yearly',
    title: 'Annual Premium',
    description: 'Best value! Save 58%',
    price: '₹999',
    priceValue: 999,
    currency: 'INR',
    duration: 'year',
    savings: '58%',
  },
  LIFETIME: {
    id: 'nutrilytics_lifetime',
    title: 'Lifetime Premium',
    description: 'One-time payment for lifetime access',
    price: '₹2,999',
    priceValue: 2999,
    currency: 'INR',
    duration: 'lifetime',
  },
};

// Free tier limits
export const FREE_TIER_LIMITS = {
  barcodeScans: 5,
  photoScans: 3,
  aiMessages: 3,
};

// Trial configuration
export const TRIAL_CONFIG = {
  durationDays: 14,
  reminderDayBefore: 2, // Send reminder 2 days before trial ends (Day 12)
};
