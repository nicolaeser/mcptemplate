# Login fields

Load this document when adding or changing consent questions.

`src/auth/login-fields.ts` is the only customization point for extra OAuth questions. Downstream
packages must append `LoginField` objects there and, if needed, a `credentialsFromBag` /
`apiTokenFromBag` helper. Do not fork `src/auth/consent.ts`, `src/auth/service.ts`,
`src/auth/routes.ts`, `src/auth/tokens.ts`, or `src/auth/fields.ts` to add a field.
Visual branding of `/authorize` lives in `src/auth/consent.html` — keep that a real
HTML file (open it in a browser to preview). Runtime fills `<!--slot:name-->` markers.

The template currently defines:

- `apiToken` — required secret, `type: "password"`, `envFallback: "UPSTREAM_API_TOKEN"`,
  `prompt: "if-missing"`.
- `accountLabel` — optional claim, `type: "text"`. Non-secret session tag.
- `region` — optional claim, `type: "select"` (`eu` / `us`). Demonstrates extra consent questions.

`template_whoami` in `src/tools/example/index.ts` returns those claims and never the token.

## Field contract

Owned by `src/auth/fields.ts`:

- `name` must match `^[A-Za-z][A-Za-z0-9_]{0,63}$` and must not be `operator_password`.
- `secret: true` values go into `bag.secrets`. They are normalized with `normalizeSecretToken`
  (trim, strip wrapping quotes, strip a leading `Bearer`/`Token` prefix).
- `secret: false` (or omitted) values go into `bag.claims` after trim only. Tools may show claims.
- `envFallback` names the process env var that fills the field when the consent form omits it.
- `prompt: "always" | "if-missing" | "never"` controls consent visibility. The default is
  `"if-missing"` when `envFallback` is set, otherwise `"always"`.
- Select fields require `options`. Values longer than 512 characters are rejected.

`collectLoginBag` is the only splitter. A secret must not be stored in `claims`; a claim must not
be stored in `secrets`.

## Env fallback and consent visibility

`visibleLoginFields` in `src/auth/service.ts` is what `/authorize` renders.

When `MCP_AUTH_PASSWORD` is set, the server password is a **separate step**. Step 1 is visible
login fields and **Continue**. Step 2 is **Server password** (`operator_password`) and **Authorize**.
If no login fields are visible (env already filled them), skip to step 2. A single POST that already
includes both still completes.

- Shared token (`MCP_AUTH_PASSWORD` + `UPSTREAM_API_TOKEN`): `apiToken` is hidden; step 1 shows
  extra questions (`accountLabel`, `region`), then step 2 is the server password.
- Gated (`MCP_AUTH_PASSWORD`, no env token): step 1 is every required secret, step 2 is the
  server password.
- Public (no `MCP_AUTH_PASSWORD`): one page, **Authorize**, no server password. `apiToken` is
  forced to `prompt: "always"`. Env `UPSTREAM_API_TOKEN` must not satisfy consent; the user must
  submit the token.
- `prompt: "never"` keeps a field off the page even when env is empty (the value then comes only
  from env or stays unset).

`src/auth/consent.html` is the previewable page. Runtime fills `<!--slot:*-->` markers.
`<!--slot:clientName-->` is the OAuth client (`client_name`, e.g. Cursor, Claude, Grok), not the
upstream product. Do not embed the page in a TypeScript return string or add fake logos.

Stdio ignores OAuth and reads env (`src/transport/stdio.ts`). HTTP tools read the sealed bag.

## Extra questions at OAuth consent

`src/auth/consent.ts` prefixes form names with `login_`. `submittedLoginFields` strips that
prefix before `collectBag`. Extra questions must be declared on `loginFields()`; they appear
automatically. Secrets must not be prefilled. Password fields must set `autocomplete` from the
field object. The operator password is not a login field.

## Encrypting the bag into the access token

`completeAuthorization` stores the `LoginBag` on the one-time code. `issuePair` in
`src/auth/tokens.ts` AES-256-GCM-encrypts that JSON into `claims.bag` on both the access token
and the refresh token (`mcp1.` HMAC envelope). The OAuth token JSON must not contain plaintext
upstream secrets. `verifyAccess` / `openBag` decrypts on this host only. Grok, Claude, Cursor,
and Codex receive the session token, never `bag.secrets`.

`resolveHttpAuth` in `src/auth/resolve.ts` recovers `apiToken` via `apiTokenFromBag` and puts
every `bag.secrets` value on `ctx.secrets`. Tools use `ctx.token` and `ctx.bag.claims`.

## Never log or return secrets

- Do not log request bodies, `Authorization` headers, login field values, or the decrypted bag.
- Tool output must pass `src/lib/redact.ts` with `ctx.secrets`. Login-bag secrets must not appear
  in text returned to the model.
- Consent HTML, health, and authorize stderr (`auth.authorize ok client=…`) must not print
  tokens, passwords, or field values.
