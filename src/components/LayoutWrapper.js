"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/genai-admin");

  if (isAdminPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main>{children}</main>
      <ScrollToTop />
      <Footer />
    </>
  );
}
