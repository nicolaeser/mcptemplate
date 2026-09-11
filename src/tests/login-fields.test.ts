import { describe, expect, it } from "vitest";
import { collectLoginBag, normalizeSecretToken } from "../auth/fields.js";
import { loginFields } from "../auth/login-fields.js";
import { isAllowedRedirect } from "../auth/redirects.js";

describe("template login fields", () => {
  it("strips Bearer prefixes from API tokens", () => {
    expect(normalizeSecretToken("Bearer sk-live-1")).toBe("sk-live-1");
    const result = collectLoginBag(loginFields(), { apiToken: ' "sk-1" ' }, {});
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.bag.secrets.apiToken).toBe("sk-1");
  });

  it("asks for extra non-secret questions besides the API token", () => {
    const names = loginFields().map((field) => field.name);
    expect(names).toEqual(["apiToken", "accountLabel", "region"]);
    expect(loginFields().find((field) => field.name === "apiToken")?.secret).toBe(true);
    expect(loginFields().find((field) => field.name === "region")?.type).toBe("select");
  });

  it("keeps extra secrets out of claims", () => {
    const result = collectLoginBag(
      loginFields(),
      { apiToken: "sk-1", accountLabel: "prod", region: "eu" },
      {}
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.bag.secrets).toEqual({ apiToken: "sk-1" });
    expect(result.bag.claims).toEqual({ accountLabel: "prod", region: "eu" });
  });
});

describe("redirect allowlist", () => {
  it("allows Grok, Cursor loopback, and the Cursor native callback", () => {
    expect(isAllowedRedirect("https://grok.com/connectors-oauth-exchange-code/")).toBe(true);
    expect(isAllowedRedirect("http://localhost:8787/callback")).toBe(true);
    expect(isAllowedRedirect("cursor://anysphere.cursor-mcp/oauth/callback")).toBe(true);
    expect(isAllowedRedirect("cursor://evil.example/oauth/callback")).toBe(false);
    expect(isAllowedRedirect("https://evil.example/login")).toBe(false);
  });
});
