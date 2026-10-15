import {
  cleanTracklistDisplayLabels,
  isNumberedTracklist,
  stripLeadingTimestampResidue,
  stripLeadingTrackIndex,
} from "@/app/lib/utils/tracklistText";

describe("stripLeadingTrackIndex", () => {
  it("removes dotted and padded indexes", () => {
    expect(stripLeadingTrackIndex("01. James Hype")).toBe("James Hype");
    expect(stripLeadingTrackIndex("1. James Hype")).toBe("James Hype");
    expect(stripLeadingTrackIndex("12) Sound De-Zign")).toBe("Sound De-Zign");
  });

  it("leaves normal artist names alone", () => {
    expect(stripLeadingTrackIndex("James Hype")).toBe("James Hype");
    expect(stripLeadingTrackIndex("99 Problems")).toBe("99 Problems");
  });
});

describe("stripLeadingTimestampResidue", () => {
  it("removes range end-times left in artist/title", () => {
    expect(stripLeadingTimestampResidue("- 2:08 Lukas & Frank")).toBe(
      "Lukas & Frank"
    );
    expect(
      stripLeadingTimestampResidue(
        "- 5:45 Give The Noise To Me (Lukas & Frank Mashup Edit)"
      )
    ).toBe("Give The Noise To Me (Lukas & Frank Mashup Edit)");
    expect(stripLeadingTimestampResidue("- 01:00:57 Lukas & Frank")).toBe(
      "Lukas & Frank"
    );
  });

  it("leaves normal labels alone", () => {
    expect(stripLeadingTimestampResidue("Lukas & Frank")).toBe("Lukas & Frank");
    expect(stripLeadingTimestampResidue("Intro")).toBe("Intro");
  });
});

describe("isNumberedTracklist", () => {
  it("detects countdown-style numbered artists", () => {
    const tracks = [
      { artist: "01. James Hype", title: "ID" },
      { artist: "02. Dodx", title: "Upside Down" },
      { artist: "03. Riordan", title: "Needle On The Record" },
      { artist: "04. ID", title: "ID" },
    ];
    expect(isNumberedTracklist(tracks)).toBe(true);
  });

  it("ignores normal tracklists", () => {
    const tracks = [
      { artist: "Kaskade", title: "Stay For Love" },
      { artist: "Kaskade & CID", title: "Vision Blurred" },
      { artist: "Kaskade", title: "Runaway" },
      { artist: "Fatboy Slim", title: "Rockafeller Skank" },
    ];
    expect(isNumberedTracklist(tracks)).toBe(false);
  });
});

describe("cleanTracklistDisplayLabels", () => {
  it("strips indexes when the list looks numbered", () => {
    const numbered = cleanTracklistDisplayLabels([
      { artist: "01. James Hype", title: "ID" },
      { artist: "02. Dodx", title: "Upside Down" },
      { artist: "03. Riordan", title: "Needle" },
    ]);
    expect(numbered.map((t) => t.artist)).toEqual([
      "James Hype",
      "Dodx",
      "Riordan",
    ]);
  });

  it("strips leaked range timestamps from range-style lists", () => {
    const cleaned = cleanTracklistDisplayLabels([
      {
        artist: "- 2:08 Lukas & Frank",
        title: "Intro",
      },
      {
        artist: "",
        title: "- 5:45 Give The Noise To Me (Lukas & Frank Mashup Edit)",
      },
      {
        artist: "- 11:41 Lukas & Frank",
        title: "ID",
      },
    ]);
    expect(cleaned[0]).toMatchObject({
      artist: "Lukas & Frank",
      title: "Intro",
    });
    expect(cleaned[1]).toMatchObject({
      artist: "",
      title: "Give The Noise To Me (Lukas & Frank Mashup Edit)",
    });
    expect(cleaned[2]).toMatchObject({
      artist: "Lukas & Frank",
      title: "ID",
    });
  });

  it("leaves a normal tracklist alone", () => {
    const normal = cleanTracklistDisplayLabels([
      { artist: "Kaskade", title: "Stay For Love" },
      { artist: "Kaskade", title: "Runaway" },
      { artist: "CID", title: "Loaded Gun" },
    ]);
    expect(normal[0].artist).toBe("Kaskade");
  });
});
