import React from "react";

export default function Lore() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-4 text-amber-400 drop-shadow-md animate-pulse">
          The Lore of Braindance
        </h1>
        <p className="text-lg leading-relaxed text-zinc-300 mb-8">
          In a world where rhythm and energy fuel existence, a new ritual has
          emerged—Braindance. Forged in underground pulses and amplified by the
          crowd's roar, Braindance is not just an event; it is a living,
          breathing entity. Each beat resonates with the collective
          consciousness, bending reality and unleashing raw expression through
          sound and movement.
        </p>

        <div className="bg-zinc-800 bg-opacity-60 p-6 rounded-2xl shadow-lg">
          <h2 className="text-3xl font-semibold mb-3 text-fuchsia-400">
            Hype Rituals
          </h2>
          <p className="text-zinc-200">
            Every city pulses with potential. As dancers fuel the rhythm, energy
            levels spike, unlocking epic visuals, global shoutouts, and sonic
            relics known as{" "}
            <span className="text-amber-300 font-medium">Echo Shards</span>.
            These moments are immortalized in the{" "}
            <span className="text-cyan-300 font-medium">Ritual Vault</span>,
            echoing across time.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-800 p-5 rounded-xl shadow-md">
            <h3 className="text-2xl font-semibold text-lime-400 mb-2">
              The Dancer
            </h3>
            <p className="text-zinc-300">
              Moving in sync with light and pulse, the Dancer controls the
              visual energy of the ritual. Their flow shapes the aura of the
              space—twisting colors, forming patterns, and invoking the unseen.
            </p>
          </div>

          <div className="bg-zinc-800 p-5 rounded-xl shadow-md">
            <h3 className="text-2xl font-semibold text-sky-400 mb-2">The DJ</h3>
            <p className="text-zinc-300">
              The conductor of chaos. They channel the crowd’s vibe, bending
              soundscapes into emotional journeys that blur the line between
              individual and collective experience.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <p className="italic text-zinc-400">
            This is only the beginning. As Braindance evolves, so too will the
            mythos. New rituals, challenges, and relics await those brave enough
            to move.
          </p>
        </div>
      </div>
    </div>
  );
}
