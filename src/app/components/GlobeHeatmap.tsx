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
      const controls = globeEl.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.3;
      controls.enableZoom = false; // Disable zooming
      controls.enablePan = false;
    }
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
    >
      <Globe
        ref={globeEl}
        width={250} // or '100%' for responsiveness
        height={250}
        globeImageUrl="https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg"
        backgroundColor="rgba(0,0,0,0)"
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
