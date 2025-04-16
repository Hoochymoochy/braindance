export default function Hero() {
  return (
    <section
      className="relative h-[80vh] flex items-center justify-center text-center bg-cover bg-center"
      style={{ backgroundImage: "url('/thermal-bg.jpg')" }}
    >
      <div className="bg-black/60 p-6 rounded-xl max-w-2xl">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
          Step into the Pulse of Sound
        </h2>
        <p className="mt-4 text-lg text-gray-300">
          Dance, react, and transform in the world's first reactive audio-visual
          ritual.
        </p>
      </div>
    </section>
  );
}
