"use client";

import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import { getAllGeo } from "@/app/lib/events/heatmap";
import { ParamValue } from "next/dist/server/request/params";

type GeoData = {
  lat: number;
  lng: number;
  weight: number;
};

type Props = {
  id: ParamValue;
};

const GlobeHeatmap: React.FC<Props> = ({ id }) => {
  const globeEl = useRef<any>(null);
  const [gData, setGData] = useState<GeoData[]>([]);

  useEffect(() => {
    if (!id || typeof id !== "string") return; // safety check

    // Set up globe controls
    if (globeEl.current) {
      const controls = globeEl.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.3;
      controls.enableZoom = false;
      controls.enablePan = false;
    }

    // Get data for this specific event
    const fetchGeo = async () => {
      const data = await getAllGeo(id); // should return array of GeoData
      if (data) setGData(data);
    };

    fetchGeo();
  }, [id]);

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
        width={250}
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
