import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import {
  checkPayment,
  balanceAfter,
  checkCreditLimit,
  utilizationPct,
  isOverExtended,
  creditHeadroom,
  MAX_PAYMENT,
  MAX_CREDIT_LIMIT,
} from "@/lib/credit";

const D = (v: string | number) => new Prisma.Decimal(v);

describe("checkPayment", () => {
  it("accepts a partial payment", () => {
    expect(checkPayment(D("2000"), "5000")).toBeNull();
  });

  it("accepts a payment that clears the balance exactly", () => {
    expect(checkPayment(D("5000"), "5000")).toBeNull();
  });

  it("rejects overpayment rather than silently trimming it", () => {
    expect(checkPayment(D("5000.01"), "5000")).toBe("EXCEEDS_DUE");
  });

  it("rejects a payment against an account that owes nothing", () => {
    expect(checkPayment(D("100"), "0")).toBe("NOTHING_OWED");
  });

  it("rejects zero and negative payments", () => {
    expect(checkPayment(D("0"), "5000")).toBe("TOO_SMALL");
    expect(checkPayment(D("-500"), "5000")).toBe("TOO_SMALL");
  });

  it("rejects an implausible amount", () => {
    expect(checkPayment(MAX_PAYMENT.add(1), MAX_PAYMENT.add(100))).toBe("TOO_LARGE");
  });

  it("accepts a single paisa against a real debt", () => {
    expect(checkPayment(D("0.01"), "5000")).toBeNull();
  });
});

describe("balanceAfter", () => {
  it("subtracts the payment", () => {
    expect(balanceAfter("5000", "2000").toString()).toBe("3000");
  });

  it("settles to exactly zero", () => {
    expect(balanceAfter("5000", "5000").toString()).toBe("0");
  });

  it("never goes negative", () => {
    expect(balanceAfter("5000", "9000").toString()).toBe("0");
  });

  it("keeps paisa exact", () => {
    expect(balanceAfter("5000.55", "1000.05").toString()).toBe("4000.5");
  });
});

describe("checkCreditLimit", () => {
  it("accepts a raise and a cut", () => {
    expect(checkCreditLimit(D("60000"), "50000")).toBeNull();
    expect(checkCreditLimit(D("40000"), "50000")).toBeNull();
  });

  it("accepts zero — a customer put on cash-only terms", () => {
    expect(checkCreditLimit(D("0"), "50000")).toBeNull();
  });

  it("rejects a negative limit", () => {
    expect(checkCreditLimit(D("-1"), "50000")).toBe("NEGATIVE");
  });

  it("rejects a slipped decimal point", () => {
    expect(checkCreditLimit(MAX_CREDIT_LIMIT.add(1), "50000")).toBe("TOO_LARGE");
  });

  it("rejects a no-op change", () => {
    expect(checkCreditLimit(D("50000"), "50000")).toBe("UNCHANGED");
  });
});

describe("creditHeadroom", () => {
  it("is limit minus due", () => {
    expect(creditHeadroom("50000", "20000").toString()).toBe("30000");
  });

  it("clamps at zero when the limit was cut below the balance", () => {
    expect(creditHeadroom("10000", "25000").toString()).toBe("0");
  });
});

describe("utilizationPct", () => {
  it("reports how much of the line is used", () => {
    expect(utilizationPct("25000", "50000").toString()).toBe("50");
  });

  it("can exceed 100 when a limit is cut below the balance", () => {
    expect(utilizationPct("25000", "10000").toString()).toBe("250");
  });

  it("is zero for an unused account with no line", () => {
    expect(utilizationPct("0", "0").toString()).toBe("0");
  });

  it("reads as fully used when a debt exists with no limit", () => {
    expect(utilizationPct("500", "0").toString()).toBe("100");
  });
});

describe("isOverExtended", () => {
  it("flags an account at its limit", () => {
    expect(isOverExtended("50000", "50000")).toBe(true);
  });

  it("flags an account past its limit", () => {
    expect(isOverExtended("60000", "50000")).toBe(true);
  });

  it("does not flag an account with headroom", () => {
    expect(isOverExtended("49999", "50000")).toBe(false);
  });

  it("does not flag a settled account with a zero limit", () => {
    expect(isOverExtended("0", "0")).toBe(false);
  });
});
