/**
 * Legacy Ollama integration — unused by the service (classification is rule-based).
 * Kept so existing imports/tests can resolve; prefer classifyListenerFallback.
 */
import { z } from "zod";
import { ARCHETYPE_CATALOG, ALL_ARCHETYPE_IDS } from "./archetypes";
import type {
  ListenerArchetypeResult,
  ListenerStats,
  ListenerTraits,
} from "./types";

export const ListenerArchetypeResultSchema = z.object({
  archetype: z.enum([
    "track_hunter",
    "collector",
    "explorer",
    "deep_listener",
  ]),
  displayTitle: z.string().min(1).max(100),
  secondaryTrait: z.enum([
    "explorer",
    "deepListener",
    "collector",
    "loyalist",
    "nightOwl",
    "trackHunter",
  ]),
  description: z.string().min(10).max(500),
  evidence: z.array(z.string()).min(1).max(5),
});

export class OllamaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OllamaError";
  }
}

/** @deprecated Classification is rule-based; this always throws. */
export async function generateListenerArchetypeWithOllama(_args: {
  stats: ListenerStats;
  traits: ListenerTraits;
}): Promise<ListenerArchetypeResult> {
  void ARCHETYPE_CATALOG;
  void ALL_ARCHETYPE_IDS;
  throw new OllamaError(
    "Ollama classification is disabled — use the rule-based classifier"
  );
}
