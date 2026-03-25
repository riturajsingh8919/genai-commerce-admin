"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import dynamic from "next/dynamic";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

const CaregiverGlobe = () => {
  const globeRef = useRef();
  const containerRef = useRef();
  const [mounted, setMounted] = useState(false);
  const [hexData, setHexData] = useState({ features: [] });

  const tealColor = "#2DD4BF";

  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 0);
    fetch(
      "https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson",
    )
      .then((res) => res.json())
      .then((geo) => setHexData(geo))
      .catch((err) => console.error("Error loading geojson", err));
    return () => clearTimeout(timeout);
  }, []);

  // ✅ Wait for globe to mount, then grab the canvas and block wheel directly on it
  useEffect(() => {
    if (!mounted) return;

    // Poll until the canvas is available inside the container
    let attempts = 0;
    const interval = setInterval(() => {
      const canvas = containerRef.current?.querySelector("canvas");
      if (canvas) {
        clearInterval(interval);

        const onWheel = (e) => {
          // Block zoom — forward scroll to page
          e.preventDefault();
          e.stopImmediatePropagation();
          window.scrollBy({ top: e.deltaY, left: 0, behavior: "auto" });
        };

        // non-passive so preventDefault works; capture so we beat OrbitControls
        canvas.addEventListener("wheel", onWheel, {
          passive: false,
          capture: true,
        });

        // Store cleanup on the canvas element itself
        canvas._wheelCleanup = () =>
          canvas.removeEventListener("wheel", onWheel, { capture: true });
      }
      if (++attempts > 40) clearInterval(interval); // give up after 2s
    }, 50);

    return () => {
      clearInterval(interval);
      const canvas = containerRef.current?.querySelector("canvas");
      canvas?._wheelCleanup?.();
    };
  }, [mounted]);

  // Lock OrbitControls zoom via rAF (safety net)
  useEffect(() => {
    if (!mounted || !globeRef.current) return;
    const globe = globeRef.current;
    let frameId;

    globe.pointOfView({ lat: 25, lng: 0, altitude: 1.8 }, 0);

    const lock = () => {
      const controls = globe.controls();
      if (controls) {
        controls.enableZoom = false;
        controls.zoomSpeed = 0;
        controls.minDistance = 280;
        controls.maxDistance = 280;
        // Keep rotation ON
        controls.enableRotate = true;
        controls.enablePan = false;
        controls.update();
      }
      frameId = requestAnimationFrame(lock);
    };

    lock();
    return () => cancelAnimationFrame(frameId);
  }, [mounted]);

  const arcsData = useMemo(
    () => [
      {
        startLat: 37.7749,
        startLng: -122.4194,
        endLat: 12.9716,
        endLng: 77.5946,
        color: tealColor,
      },
      {
        startLat: 40.7128,
        startLng: -74.006,
        endLat: 19.076,
        endLng: 72.8777,
        color: tealColor,
      },
      {
        startLat: 34.0522,
        startLng: -118.2437,
        endLat: 28.6139,
        endLng: 77.209,
        color: tealColor,
      },
      {
        startLat: 51.5074,
        startLng: -0.1278,
        endLat: 13.0827,
        endLng: 80.2707,
        color: tealColor,
      },
      {
        startLat: 51.5074,
        startLng: -0.1278,
        endLat: 39.9042,
        endLng: 116.4074,
        color: tealColor,
      },
      {
        startLat: 19.4326,
        startLng: -99.1332,
        endLat: 38.9072,
        endLng: -77.0369,
        color: tealColor,
      },
    ],
    [],
  );

  const pointsData = useMemo(
    () => [
      {
        lat: 12.9716,
        lng: 77.5946,
        size: 0.1,
        color: tealColor,
        label: "Heart Rate: 72 bpm – Stable",
      },
      {
        lat: 39.9042,
        lng: 116.4074,
        size: 0.1,
        color: tealColor,
        label: "Sleep Score: 87 – Well Rested",
      },
      {
        lat: 38.9072,
        lng: -77.0369,
        size: 0.1,
        color: tealColor,
        label: "Stress Score: 10 – Relaxed",
      },
    ],
    [],
  );

  const containerHeightClass = "h-[450px] sm:h-[600px] lg:h-[850px]";

  if (!mounted) return <div className={`w-full ${containerHeightClass}`} />;

  return (
    <div
      ref={containerRef}
      className={`w-full ${containerHeightClass} relative`}
    >
      <Globe
        ref={globeRef}
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere={true}
        atmosphereColor={tealColor}
        atmosphereAltitude={0.15}
        hexPolygonsData={hexData.features}
        hexPolygonResolution={3}
        hexPolygonMargin={0.7}
        hexPolygonColor={() => `rgba(45, 212, 191, 0.4)`}
        arcsData={arcsData}
        arcColor={"color"}
        arcDashLength={0.4}
        arcDashGap={2}
        arcDashAnimateTime={2000}
        arcStroke={0.5}
        pointsData={pointsData}
        pointColor={"color"}
        pointAltitude={0.01}
        pointRadius={0.8}
        labelDotRadius={0.5}
        labelColor={() => tealColor}
        pointLabel={"label"}
        enablePointerInteraction={true}
        enableZoom={false}
        waitForGlobeReady={true}
        animateIn={true}
      />

      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.05)_0%,transparent_70%)] invisible md:visible" />
    </div>
  );
};

export default CaregiverGlobe;
