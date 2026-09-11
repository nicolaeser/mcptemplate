import type { LoginField } from "./fields.js";

export function loginFields(): readonly LoginField[] {
  return [
    {
      name: "apiToken",
      label: "API token",
      type: "password",
      required: true,
      secret: true,
      envFallback: "UPSTREAM_API_TOKEN",
      prompt: "if-missing",
      autocomplete: "new-password",
      placeholder: "API token"
    },
    {
      name: "accountLabel",
      prompt: "never",
      label: "Account label",
      type: "text",
      required: false,
      secret: false,
      help: "Optional non-secret tag stored on the session."
    },
    {
      name: "region",
      prompt: "never",
      label: "Region",
      type: "select",
      required: false,
      secret: false,
      options: [
        { value: "eu", label: "EU" },
        { value: "us", label: "US" }
      ]
    }
  ];
}

export function apiTokenFromBag(
  bag: { readonly secrets: Readonly<Record<string, string>> },
  envToken: string | undefined
): string | undefined {
  const fromBag = bag.secrets.apiToken?.trim();
  if (fromBag !== undefined && fromBag.length > 0) return fromBag;
  if (envToken !== undefined && envToken.length > 0) return envToken;
  return undefined;
}
