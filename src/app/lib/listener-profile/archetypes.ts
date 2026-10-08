import type { ListenerArchetypeDefinition, ListenerArchetypeId } from "./types";

export const ARCHETYPE_CATALOG: Record<
  ListenerArchetypeId,
  ListenerArchetypeDefinition
> = {
  track_hunter: {
    id: "track_hunter",
    name: "Track Hunter",
    displayTitle: "The Track Hunter",
    description:
      "Always digging through DJ sets for the next track worth saving.",
  },
  collector: {
    id: "collector",
    name: "Collector",
    displayTitle: "The Collector",
    description: "Builds crates and saves sets regularly.",
  },
  explorer: {
    id: "explorer",
    name: "Explorer",
    displayTitle: "The Explorer",
    description: "Listens to a wide variety of DJs.",
  },
  deep_listener: {
    id: "deep_listener",
    name: "Deep Listener",
    displayTitle: "The Deep Listener",
    description: "Spends long sessions listening to full mixes.",
  },
};

export const ALL_ARCHETYPE_IDS: ListenerArchetypeId[] = [
  "track_hunter",
  "collector",
  "explorer",
  "deep_listener",
];

export function getArchetypeDefinition(
  id: ListenerArchetypeId
): ListenerArchetypeDefinition {
  return ARCHETYPE_CATALOG[id] ?? ARCHETYPE_CATALOG.explorer;
}
