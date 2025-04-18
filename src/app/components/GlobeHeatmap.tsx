// GlobeHeatmap.tsx
"use client";

import React, { useEffect, useRef } from "react";
import Globe from "react-globe.gl";

const GlobeHeatmap: React.FC = () => {
  const globeEl = useRef<any>(null);

  const gData = [...Array(900).keys()].map(() => ({
    lat: (Math.random() - 0.5) * 160,
    lng: (Math.random() - 0.5) * 360,
    weight: Math.random(),
  }));

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.3;
    }
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        maxWidth: "600px", // You can adjust or remove this
        maxHeight: "600px", // You can adjust or remove this
        position: "relative",
      }}
    >
      <Globe
        ref={globeEl}
        width={undefined} // Let Globe handle width via container
        height={undefined} // Let Globe handle height via container
        globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg"
        heatmapsData={[gData]}
        heatmapPointLat="lat"
        heatmapPointLng="lng"
        heatmapPointWeight="weight"
        heatmapTopAltitude={0.7}
        heatmapsTransitionDuration={3000}
        enablePointerInteraction={false}
      />
    </div>
  );
};

export default GlobeHeatmap;
