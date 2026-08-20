import { describe, it, expect } from "vitest";
import {
  normalizeSlug,
  checkSlug,
  slugFromName,
  MIN_SLUG_LENGTH,
  MAX_SLUG_LENGTH,
  RESERVED_SLUGS,
} from "@/lib/tenant";

describe("normalizeSlug", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(normalizeSlug("Shree Petroleum")).toBe("shree-petroleum");
  });

  it("treats underscores as hyphens", () => {
    expect(normalizeSlug("shree_petroleum")).toBe("shree-petroleum");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeSlug("  SHREE-PETROLEUM  ")).toBe("shree-petroleum");
  });

  it("collapses repeated separators", () => {
    expect(normalizeSlug("shree   ---___ petroleum")).toBe("shree-petroleum");
  });

  it("strips leading and trailing hyphens", () => {
    expect(normalizeSlug("---shree---")).toBe("shree");
  });

  it("drops punctuation that would break a URL", () => {
    expect(normalizeSlug("Shree Petroleum Pvt. Ltd.")).toBe("shree-petroleum-pvt-ltd");
    expect(normalizeSlug("a@b#c$d")).toBe("abcd");
  });

  it("keeps digits", () => {
    expect(normalizeSlug("Pump 404")).toBe("pump-404");
  });

  it("is idempotent — normalising twice changes nothing", () => {
    const once = normalizeSlug("  Shree__Petroleum Pvt. Ltd.  ");
    expect(normalizeSlug(once)).toBe(once);
  });

  it("maps every casing and separator variant onto the same tenant", () => {
    const variants = ["Shree Petroleum", "shree_petroleum", "SHREE-PETROLEUM", "  shree   petroleum "];
    const resolved = new Set(variants.map(normalizeSlug));
    expect(resolved.size).toBe(1);
    expect([...resolved][0]).toBe("shree-petroleum");
  });

  it("returns empty for input with nothing usable in it", () => {
    expect(normalizeSlug("!!!")).toBe("");
    expect(normalizeSlug("   ")).toBe("");
  });
});

describe("checkSlug", () => {
  it("accepts an ordinary code", () => {
    expect(checkSlug("shree-petroleum")).toBeNull();
  });

  it("rejects empty and over-short codes", () => {
    expect(checkSlug("")).toBe("EMPTY");
    expect(checkSlug("ab")).toBe("TOO_SHORT");
    expect(checkSlug("a".repeat(MIN_SLUG_LENGTH))).toBeNull();
  });

  it("rejects an over-long code", () => {
    expect(checkSlug("a".repeat(MAX_SLUG_LENGTH + 1))).toBe("TOO_LONG");
    expect(checkSlug("a".repeat(MAX_SLUG_LENGTH))).toBeNull();
  });

  it("rejects reserved codes that would collide with routes", () => {
    for (const reserved of ["admin", "api", "login", "www", "dashboard"]) {
      expect(checkSlug(reserved), reserved).toBe("RESERVED");
    }
  });

  it("guards every reserved word in the list", () => {
    for (const reserved of RESERVED_SLUGS) {
      expect(checkSlug(reserved), reserved).toBe("RESERVED");
    }
  });

  it("allows a reserved word as part of a longer code", () => {
    expect(checkSlug("admin-fuels")).toBeNull();
    expect(checkSlug("api-petroleum")).toBeNull();
  });
});

describe("slugFromName", () => {
  it("suggests a code from a station name", () => {
    expect(slugFromName("Shree Petroleum Pvt. Ltd.")).toBe("shree-petroleum-pvt-ltd");
  });

  it("truncates an over-long name to the maximum", () => {
    const suggestion = slugFromName("A".repeat(100));
    expect(suggestion.length).toBeLessThanOrEqual(MAX_SLUG_LENGTH);
  });

  it("never leaves a trailing hyphen after truncation", () => {
    // Engineered so the cut lands exactly on a hyphen.
    const name = "a".repeat(MAX_SLUG_LENGTH - 1) + " bcd";
    expect(slugFromName(name).endsWith("-")).toBe(false);
  });

  it("produces something checkSlug accepts for a normal name", () => {
    expect(checkSlug(slugFromName("Everest Fuels"))).toBeNull();
  });
});
