import { describe, it, expect } from "vitest";
import {
  normalizeUsername,
  checkUsername,
  usernameFromName,
  MIN_USERNAME_LENGTH,
  MAX_USERNAME_LENGTH,
  RESERVED_USERNAMES,
} from "@/lib/username";

describe("normalizeUsername", () => {
  it("lowercases", () => {
    expect(normalizeUsername("Ramesh")).toBe("ramesh");
  });

  it("turns spaces into dots", () => {
    expect(normalizeUsername("Ramesh Thapa")).toBe("ramesh.thapa");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeUsername("  ramesh  ")).toBe("ramesh");
  });

  it("keeps dots, underscores and hyphens", () => {
    expect(normalizeUsername("ramesh.thapa_1-x")).toBe("ramesh.thapa_1-x");
  });

  it("drops characters that would be ambiguous in a log or URL", () => {
    expect(normalizeUsername("ramesh@thapa!")).toBe("rameshthapa");
    expect(normalizeUsername("ram/esh")).toBe("ramesh");
  });

  it("collapses repeated separators", () => {
    expect(normalizeUsername("ramesh...thapa")).toBe("ramesh.thapa");
    expect(normalizeUsername("ramesh___thapa")).toBe("ramesh_thapa");
  });

  it("strips leading and trailing separators", () => {
    expect(normalizeUsername("..ramesh..")).toBe("ramesh");
    expect(normalizeUsername("--ramesh--")).toBe("ramesh");
  });

  it("is idempotent", () => {
    const once = normalizeUsername("  Ramesh   Thapa..  ");
    expect(normalizeUsername(once)).toBe(once);
  });

  it("maps every casing and spacing variant onto one account", () => {
    const variants = ["Ramesh Thapa", "ramesh.thapa", "  RAMESH_THAPA  ", "Ramesh.Thapa"];
    const resolved = new Set(variants.map(normalizeUsername));
    // Underscore is a distinct separator, so that one differs on purpose;
    // what matters is that case and spacing never split an identity.
    expect(normalizeUsername("Ramesh Thapa")).toBe("ramesh.thapa");
    expect(normalizeUsername("Ramesh.Thapa")).toBe("ramesh.thapa");
    expect(normalizeUsername("RAMESH THAPA")).toBe("ramesh.thapa");
    expect(resolved.size).toBeLessThanOrEqual(2);
  });

  it("returns empty when nothing usable remains", () => {
    expect(normalizeUsername("@@@")).toBe("");
    expect(normalizeUsername("   ")).toBe("");
    expect(normalizeUsername("...")).toBe("");
  });
});

describe("checkUsername", () => {
  it("accepts an ordinary username", () => {
    expect(checkUsername("ramesh")).toBeNull();
    expect(checkUsername("ramesh.thapa")).toBeNull();
    expect(checkUsername("bikash_2")).toBeNull();
  });

  it("rejects empty and over-short", () => {
    expect(checkUsername("")).toBe("EMPTY");
    expect(checkUsername("ab")).toBe("TOO_SHORT");
    expect(checkUsername("abc")).toBeNull();
  });

  it("rejects over-long", () => {
    expect(checkUsername("a".repeat(MAX_USERNAME_LENGTH + 1))).toBe("TOO_LONG");
    expect(checkUsername("a".repeat(MAX_USERNAME_LENGTH))).toBeNull();
  });

  it("rejects a username with no letter in it", () => {
    // Otherwise "12345" reads like an id or a receipt number in a report.
    expect(checkUsername("12345")).toBe("NO_LETTER");
    expect(checkUsername("1.2_3")).toBe("NO_LETTER");
    expect(checkUsername("user1")).not.toBe("NO_LETTER");
  });

  it("rejects every reserved word", () => {
    for (const reserved of RESERVED_USERNAMES) {
      expect(checkUsername(reserved), reserved).toBe("RESERVED");
    }
  });

  it("rejects role names, so a username can't impersonate a role", () => {
    for (const role of ["owner", "manager", "cashier", "attendant", "admin"]) {
      expect(checkUsername(role), role).toBe("RESERVED");
    }
  });

  it("allows a reserved word as part of a longer username", () => {
    expect(checkUsername("admin.ramesh")).toBeNull();
    expect(checkUsername("owner2")).toBeNull();
  });

  it("has a minimum that matches the constant", () => {
    expect(checkUsername("a".repeat(MIN_USERNAME_LENGTH - 1))).toBe("TOO_SHORT");
  });
});

describe("usernameFromName", () => {
  it("suggests a username from a person's name", () => {
    expect(usernameFromName("Ramesh Thapa")).toBe("ramesh.thapa");
  });

  it("handles a single name", () => {
    expect(usernameFromName("Bikash")).toBe("bikash");
  });

  it("handles initials with dots", () => {
    expect(usernameFromName("Anita K.C.")).toBe("anita.k.c");
  });

  it("truncates a very long name and leaves no trailing separator", () => {
    const suggestion = usernameFromName("a".repeat(MAX_USERNAME_LENGTH - 1) + " bcd");
    expect(suggestion.length).toBeLessThanOrEqual(MAX_USERNAME_LENGTH);
    expect(/[._-]$/.test(suggestion)).toBe(false);
  });

  it("produces something checkUsername accepts for a normal name", () => {
    expect(checkUsername(usernameFromName("Prakash Shrestha"))).toBeNull();
  });
});
