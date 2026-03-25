"use client";

import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import type { GlobeMethods } from "react-globe.gl";
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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const GlobeHeatmap: React.FC<Props> = ({ id }) => {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const [gData, setGData] = useState<GeoData[]>([]);

  useEffect(() => {
    if (!id || typeof id !== "string" || !UUID_REGEX.test(id)) {
      setGData([]);
      return;
    }

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
      try {
        const data = await getAllGeo(id);
        if (data) setGData(data);
      } catch {
        setGData([]);
      }
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
