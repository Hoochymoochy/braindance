import { resolveSearchNavigation } from "@/app/lib/utils/djSetSearch";

const sets = [
  {
    video_id: "l5wro3bMZWc",
    title: "Kaskade Live at EDC Las Vegas 2026",
    channel: "Insomniac",
  },
  {
    video_id: "hiBqHufa_Rg",
    title: "James Hype Live",
    channel: "James Hype",
  },
  {
    video_id: "abcABC12345",
    title: "Kaskade Warehouse Project",
    channel: "Kaskade",
  },
];

describe("resolveSearchNavigation", () => {
  it("opens an exact video id", () => {
    expect(resolveSearchNavigation(sets, "hiBqHufa_Rg")).toEqual({
      videoId: "hiBqHufa_Rg",
      set: sets[1],
    });
  });

  it("opens a YouTube URL even if not in catalog", () => {
    expect(
      resolveSearchNavigation(
        sets,
        "https://www.youtube.com/watch?v=zzzzzzzzzzz"
      )
    ).toEqual({ videoId: "zzzzzzzzzzz", set: null });
  });

  it("prefers an exact title match", () => {
    expect(resolveSearchNavigation(sets, "James Hype Live")).toEqual({
      videoId: "hiBqHufa_Rg",
      set: sets[1],
    });
  });

  it("falls back to the strongest text match", () => {
    const hit = resolveSearchNavigation(sets, "Kaskade");
    expect(hit?.videoId).toBe("l5wro3bMZWc");
  });

  it("returns null when nothing matches", () => {
    expect(resolveSearchNavigation(sets, "nope-nope")).toBeNull();
  });
});
