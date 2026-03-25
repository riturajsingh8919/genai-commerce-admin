"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Global Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
          backgroundColor: "#000d24",
          color: "white",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{ textAlign: "center", padding: "40px 24px", maxWidth: 520 }}
        >
          {/* Animated pulse ring */}
          <div
            style={{
              width: 120,
              height: 120,
              margin: "0 auto 40px",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "2px solid rgba(0, 39, 237, 0.3)",
                animation: "pulse-ring 2s ease-in-out infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 16,
                borderRadius: "50%",
                border: "2px solid rgba(0, 39, 237, 0.5)",
                animation: "pulse-ring 2s ease-in-out infinite 0.3s",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 32,
                borderRadius: "50%",
                backgroundColor: "rgba(0, 39, 237, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(0, 39, 237, 0.8)"
                strokeWidth="1.5"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          </div>

          <h1
            style={{
              fontSize: 32,
              fontWeight: 300,
              marginBottom: 12,
              letterSpacing: "-0.02em",
            }}
          >
            System Disruption
          </h1>
          <p
            style={{
              fontSize: 14,
              fontWeight: 300,
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.7,
              marginBottom: 40,
            }}
          >
            NxRing experienced an unexpected disruption. Our systems are working
            to restore normal operations. Your data is safe.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => reset()}
              style={{
                padding: "14px 32px",
                backgroundColor: "#0027ED",
                color: "white",
                border: "none",
                borderRadius: 16,
                fontSize: 10,
                fontWeight: 300,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Retry Connection
            </button>
            <Link
              href="/"
              style={{
                padding: "14px 32px",
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16,
                fontSize: 10,
                fontWeight: 300,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Return Home
            </Link>
          </div>

          <style>{`
            @keyframes pulse-ring {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.1); opacity: 0.5; }
            }
          `}</style>
        </div>
      </body>
    </html>
  );
}
