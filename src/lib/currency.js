// Multi-country currency utilities
export const CURRENCY_MAP = {
  USD: "$",
  INR: "₹",
  GBP: "£",
  EUR: "€",
  AED: "د.إ",
  CAD: "C$",
  AUD: "A$",
  SGD: "S$",
  JPY: "¥",
};

export const getCurrencySymbol = (code) => CURRENCY_MAP[code] || code;

// Country code to default currency mapping
export const COUNTRY_CURRENCY_MAP = {
  US: "USD",
  IN: "INR",
  GB: "GBP",
  DE: "EUR",
  FR: "EUR",
  AE: "AED",
  CA: "CAD",
  AU: "AUD",
  SG: "SGD",
  JP: "JPY",
};

export const getDefaultCurrency = (countryCode) =>
  COUNTRY_CURRENCY_MAP[countryCode] || "USD";

/**
 * Formats a price according to the currency code.
 * Specifically handles Indian Rupee (INR) with en-IN locale for correct separators.
 */
export const formatPrice = (price, currency = "USD") => {
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(price);
  }
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};
