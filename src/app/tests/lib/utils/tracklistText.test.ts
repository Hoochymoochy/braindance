import {
  cleanTracklistDisplayLabels,
  isNumberedTracklist,
  splitArtistTitle,
  splitTitleByArtist,
  stripLeadingEqualsMarker,
  stripLeadingTimestampResidue,
  stripLeadingTrackIndex,
  stripTrailingSocialHandles,
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

describe("stripLeadingEqualsMarker", () => {
  it("removes decorative leading equals", () => {
    expect(stripLeadingEqualsMarker("= Bart Skils & Weska")).toBe(
      "Bart Skils & Weska"
    );
    expect(stripLeadingEqualsMarker("= ID")).toBe("ID");
  });

  it("leaves normal artists alone", () => {
    expect(stripLeadingEqualsMarker("Bart Skils")).toBe("Bart Skils");
  });
});

describe("stripTrailingSocialHandles", () => {
  it("removes one or more trailing @handles", () => {
    expect(
      stripTrailingSocialHandles("Nao Andianta (Mx Cartier Remix) @MxCartier_ofc")
    ).toBe("Nao Andianta (Mx Cartier Remix)");
    expect(
      stripTrailingSocialHandles(
        "You Can Do Iy Baby @toolroomrecords @DJMARKKNIGHT"
      )
    ).toBe("You Can Do Iy Baby");
    expect(
      stripTrailingSocialHandles("Beautiful (Unreleased) @Menu.production")
    ).toBe("Beautiful (Unreleased)");
  });

  it("leaves titles without handles alone", () => {
    expect(stripTrailingSocialHandles("Get Down")).toBe("Get Down");
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

describe("splitArtistTitle", () => {
  it("splits en-dash artist/title pairs", () => {
    expect(
      splitArtistTitle('Dish Dash – ID (Intro Edit / "Look at the Robot")')
    ).toEqual({
      artist: "Dish Dash",
      title: 'ID (Intro Edit / "Look at the Robot")',
    });
    expect(
      splitArtistTitle("Green Velvet – La La Land (Dish Dash Remix / Edit)")
    ).toEqual({
      artist: "Green Velvet",
      title: "La La Land (Dish Dash Remix / Edit)",
    });
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

  it("strips leading equals markers from artists", () => {
    const cleaned = cleanTracklistDisplayLabels([
      { artist: "= Bart Skils & Weska", title: "Silent Pressure" },
      { artist: "= Blawan", title: "Why They Hide Their Bodies Under My Garage?" },
      { artist: "= ID", title: "ID" },
    ]);
    expect(cleaned.map((t) => t.artist)).toEqual([
      "Bart Skils & Weska",
      "Blawan",
      "ID",
    ]);
  });

  it("strips trailing social handles from titles", () => {
    const cleaned = cleanTracklistDisplayLabels([
      {
        artist: "Trio Mocota",
        title: "Nao Andianta (Mx Cartier Remix) @MxCartier_ofc",
      },
      {
        artist: "Mark Knight, Danny Howard",
        title: "You Can Do Iy Baby @toolroomrecords @DJMARKKNIGHT",
      },
      { artist: "TwoSlice", title: "Get Down" },
    ]);
    expect(cleaned.map((t) => t.title)).toEqual([
      "Nao Andianta (Mx Cartier Remix)",
      "You Can Do Iy Baby",
      "Get Down",
    ]);
  });

  it("recovers artist when the source used an en-dash", () => {
    const cleaned = cleanTracklistDisplayLabels([
      {
        artist: "",
        title: 'Dish Dash – ID (Intro Edit / "Look at the Robot")',
      },
      {
        artist: "",
        title: "Dish Dash & Glowal – All I Wanna Do",
      },
    ]);
    expect(cleaned[0]).toMatchObject({
      artist: "Dish Dash",
      title: 'ID (Intro Edit / "Look at the Robot")',
    });
    expect(cleaned[1]).toMatchObject({
      artist: "Dish Dash & Glowal",
      title: "All I Wanna Do",
    });
  });

  it("recovers artist from Title by Artist titles", () => {
    const cleaned = cleanTracklistDisplayLabels([
      { artist: "", title: "Stay For Love by Kaskade" },
      { artist: "—", title: "Vision Blurred By Kaskade & CID" },
      {
        artist: "",
        title: "Stand by Me by Ben E. King",
      },
    ]);
    expect(cleaned[0]).toMatchObject({
      artist: "Kaskade",
      title: "Stay For Love",
    });
    expect(cleaned[1]).toMatchObject({
      artist: "Kaskade & CID",
      title: "Vision Blurred",
    });
    expect(cleaned[2]).toMatchObject({
      artist: "Ben E. King",
      title: "Stand by Me",
    });
  });

  it("does not overwrite an existing artist with a by-split", () => {
    const cleaned = cleanTracklistDisplayLabels([
      { artist: "Kaskade", title: "Stay For Love by Someone Else" },
    ]);
    expect(cleaned[0]).toMatchObject({
      artist: "Kaskade",
      title: "Stay For Love by Someone Else",
    });
  });
});

describe("splitTitleByArtist", () => {
  it("splits on the last by separator", () => {
    expect(splitTitleByArtist("Stand by Me by Ben E. King")).toEqual({
      artist: "Ben E. King",
      title: "Stand by Me",
    });
  });

  it("skips short false-positive artist tails", () => {
    expect(splitTitleByArtist("Stand by Me")).toEqual({
      artist: "",
      title: "Stand by Me",
    });
  });
});
