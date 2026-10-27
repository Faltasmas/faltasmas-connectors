import { describe, expect, test } from "bun:test";
import { ConnectorError, isConnectorError } from "../src/index";

class BundleConnectorError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "ConnectorError";
  }
}

describe("isConnectorError", () => {
  test("recognises a ConnectorError", () => {
    expect(isConnectorError(new ConnectorError("session_expired", "x"))).toBe(true);
  });
  test("recognises an impostor from another bundle", () => {
    const e = new BundleConnectorError("invalid_credentials", "x");
    expect(e instanceof ConnectorError).toBe(false);
    expect(isConnectorError(e)).toBe(true);
  });
  test("rejects plain errors, wrong codes and null", () => {
    expect(isConnectorError(new Error("x"))).toBe(false);
    expect(isConnectorError(new BundleConnectorError("nope", "x"))).toBe(false);
    expect(isConnectorError(null)).toBe(false);
    expect(isConnectorError(undefined)).toBe(false);
    expect(isConnectorError("ConnectorError")).toBe(false);
  });
  test("subclass keeps instanceof", () => {
    class Sub extends ConnectorError {}
    const e = new Sub("unexpected_response", "x");
    expect(e instanceof Sub).toBe(true);
    expect(e instanceof ConnectorError).toBe(true);
    expect(isConnectorError(e)).toBe(true);
  });
});
