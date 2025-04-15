import Image from "next/image";
import Globe from "@/app/componets/GlobeHeatmap";
export default function Home() {
  return (
    <div className="flex bg-black">
      <Globe />
    </div>
  );
}
