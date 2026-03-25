"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const CountryContext = createContext();

export const useCountry = () => useContext(CountryContext);

/**
 * Multi-service IP geolocation with fallback chain.
 * Tries multiple free services to ensure reliability across all environments.
 */
async function detectCountryFromIP() {
  // Service 1: api.country.is (fast, reliable, JSON)
  try {
    const res = await fetch("https://api.country.is/", { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data.country && data.country.length === 2) {
        console.log(`🌍 Country detected via api.country.is: ${data.country}`);
        return data.country.toUpperCase();
      }
    }
  } catch (e) { /* silent fallback */ }

  // Service 2: ip2c.org (lightweight, text response)
  try {
    const res = await fetch("https://ip2c.org/self", { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const text = await res.text();
      // Format: "1;IN;IND;India"
      const parts = text.split(";");
      if (parts[0] === "1" && parts[1] && parts[1].length === 2) {
        console.log(`🌍 Country detected via ip2c.org: ${parts[1]}`);
        return parts[1].toUpperCase();
      }
    }
  } catch (e) { /* silent fallback */ }

  // Service 3: Cloudflare trace (works if site is behind CF, but also as direct call)
  try {
    const res = await fetch("https://1.1.1.1/cdn-cgi/trace", { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const text = await res.text();
      const match = text.match(/loc=([A-Z]{2})/);
      if (match) {
        console.log(`🌍 Country detected via Cloudflare trace: ${match[1]}`);
        return match[1];
      }
    }
  } catch (e) { /* silent fallback */ }

  return null;
}

export const CountryProvider = ({ children }) => {
  const [detectedCountry, setDetectedCountry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectCountry = async () => {
      try {
        // 1. Check if there's a URL override (?country=IN)
        const params = new URLSearchParams(window.location.search);
        const override = params.get("country");
        if (override && override.length === 2) {
          const country = override.toUpperCase();
          setDetectedCountry(country);
          sessionStorage.setItem("nexring-country", country);
          setLoading(false);
          return;
        }

        // 2. Check sessionStorage cache to avoid repeated API calls
        const cached = sessionStorage.getItem("nexring-country");
        if (cached && cached.length === 2) {
          setDetectedCountry(cached);
          setLoading(false);
          return;
        }

        // 3. Detect via multi-service IP geolocation
        const country = await detectCountryFromIP();
        if (country) {
          setDetectedCountry(country);
          sessionStorage.setItem("nexring-country", country);
        } else {
          // 4. Fallback to US
          console.warn("⚠️ All geolocation services failed. Defaulting to US.");
          setDetectedCountry("US");
          sessionStorage.setItem("nexring-country", "US");
        }
      } catch (e) {
        console.warn("Country detection failed, defaulting to US:", e);
        setDetectedCountry("US");
        sessionStorage.setItem("nexring-country", "US");
      } finally {
        setLoading(false);
      }
    };

    detectCountry();
  }, []);

  return (
    <CountryContext.Provider value={{ detectedCountry, loading, setDetectedCountry }}>
      {children}
    </CountryContext.Provider>
  );
};

