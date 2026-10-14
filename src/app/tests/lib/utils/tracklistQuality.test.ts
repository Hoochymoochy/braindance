import { isLikelySpamTracklist } from "@/app/lib/utils/tracklistQuality";

describe("isLikelySpamTracklist", () => {
  it("rejects comment spam where almost every cue is the same joke title", () => {
    const tracks = Array.from({ length: 23 }, (_, i) => ({
      title: i === 3 ? "deyyuuummmm (Kaskade Edit)" : "deyyuuummmm",
    }));
    expect(isLikelySpamTracklist(tracks)).toBe(true);
  });

  it("keeps a normal varied tracklist", () => {
    const tracks = [
      { title: "Stay For Love" },
      { title: "Vision Blurred" },
      { title: "Runaway" },
      { title: "Heaven Knows vs. Dope" },
      { title: "Meet Again" },
      { title: "Dealin With It" },
    ];
    expect(isLikelySpamTracklist(tracks)).toBe(false);
  });

  it("ignores short lists", () => {
    expect(
      isLikelySpamTracklist([
        { title: "Same" },
        { title: "Same" },
        { title: "Same" },
      ])
    ).toBe(false);
  });
});
