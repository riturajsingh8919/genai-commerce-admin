import { Outfit, Inria_Serif } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import { CartProvider } from "@/context/CartContext";
import { CountryProvider } from "@/context/CountryContext";
import OfflineDetector from "@/components/OfflineDetector";

const outfitSans = Outfit({
  variable: "--font-outfit-sans",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const metadata = {
  title: "NxRing - Smart Health Ring",
  description:
    "Annual tests covering 150+ biomarkers, integrated with continuous biometric data to predict, prevent and protect.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${outfitSans.variable} antialiased`}>
        {/* Load reCAPTCHA v3 — registers the site key so execute() works anywhere */}
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
          strategy="afterInteractive"
        />
        <OfflineDetector />
        <CountryProvider>
          <CartProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
          </CartProvider>
        </CountryProvider>
      </body>
    </html>
  );
}
