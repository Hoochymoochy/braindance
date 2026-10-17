import { cleanSetTitle, decodeHtmlEntities } from "@/app/lib/utils/setTitle";

describe("decodeHtmlEntities", () => {
  it("decodes common named and numeric entities", () => {
    expect(decodeHtmlEntities("Techno &amp; Peak Time")).toBe(
      "Techno & Peak Time"
    );
    expect(decodeHtmlEntities("A &#39;quote&#39;")).toBe("A 'quote'");
  });
});

describe("cleanSetTitle", () => {
  it("collapses YouTube mix marketing into artist at venue", () => {
    expect(
      cleanSetTitle(
        "YOUNA - Melodic Techno &amp; Peak Time DJ Mix @ Gravity - TAP1 I Denmark"
      )
    ).toBe("YOUNA at Gravity");
  });

  it("keeps artist when there is fluff but no venue", () => {
    expect(
      cleanSetTitle("Kaskade - Melodic House & Techno DJ Mix 2024")
    ).toBe("Kaskade");
  });

  it("leaves a simple title alone", () => {
    expect(cleanSetTitle("Kaskade Live at EDC Las Vegas 2026")).toBe(
      "Kaskade Live at EDC Las Vegas 2026"
    );
  });

  it("keeps meaningful dash titles that are not mix fluff", () => {
    expect(cleanSetTitle("Bicep - Glue (Live Edit)")).toBe(
      "Bicep - Glue (Live Edit)"
    );
  });

  it("collapses festival pipe titles into artist at event", () => {
    expect(
      cleanSetTitle(
        "Alesso | Tomorrowland 2026 (Mainstage Weekend 1) [Full DJ Live Set]"
      )
    ).toBe("Alesso at Tomorrowland 2026");
  });

  it("normalizes leftover @ symbols to at", () => {
    expect(cleanSetTitle("Amelie Lens @ Awakenings")).toBe(
      "Amelie Lens at Awakenings"
    );
    expect(cleanSetTitle("Amelie Lens@Awakenings")).toBe(
      "Amelie Lens at Awakenings"
    );
  });
});
