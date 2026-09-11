# Architecture

Load this document when choosing which layer a change belongs in.

This package is a hostable MCP server. Stdio is the local process transport. HTTP is Streamable
HTTP at `/mcp` plus OAuth at `/authorize`, `/token`, `/register`, and RFC 9728 metadata.

## Entry points

- `src/index.ts` — CLI: stdio by default, `http` for the listener.
- `src/http-main.ts` — HTTP process. Refuses tokens on argv.
- `src/transport/stdio.ts` — stdio MCP. Uses env credentials. Must not speak OAuth.
- `src/transport/http.ts` — Express app, Host allowlist, health.
- `src/transport/mcp-sessions.ts` — Streamable HTTP session table and sqlite restore.
- `src/auth/persist.ts` — durable OAuth clients, families, codes, CSRF.
- `src/lib/session-store.ts` — AES-GCM sqlite (`node:sqlite`, no extra package).
- `src/lib/durable.ts` — KV adapter over sqlite or memory.
- `src/auth/routes.ts` — OAuth HTTP surface and consent POST.
- `src/mcp/server.ts` and `src/mcp/catalog.ts` — MCP server and tool catalog.
- `src/auth/login-fields.ts` — the only login-question customization point.
- `src/upstream/client.ts` — Axios upstream client. Clones rename this to `src/<domain>/client.ts`.

## Product clones

This template is product-agnostic. It ships no vendor API and must not gain one. Example tools in
`src/tools/example/` must not call a real product API. `template_get` is the Axios example; tests
inject an `axiosInstance` adapter and must not make live requests.

A product clone must implement the vendor HTTP client inside the clone package, or call a
published domain client:

- Own the client at `src/<domain>/client.ts` using **axios** (this template's default), or depend
  on a published package such as `npmsevdesk`. Inject `axiosInstance` in tests. Do not start new
  clones on `fetch`.
- Runtime `package.json#dependencies` include `@modelcontextprotocol/sdk`, `express`, `zod`, and
  `axios`. Extra runtime deps are fine when they are public npm packages.
- Do not use `file:` workspace links to unpublished sibling packages.

`src/auth/` stays the OAuth host. Tools in `src/tools/` call the in-package client with credentials
from the sealed login bag (`ctx.token` / `ctx.bag`), never a connector-supplied secret.

## Facts that are easy to get wrong

- HTTP Bearer must be an `mcp1.` session token from this host. The upstream API token is not a
  connector credential.
- Tool handlers receive the upstream token from the sealed login bag, never from the client.
- `scripts/index-tools.mjs` regenerates the catalog index on `prebuild` / `pretest`.
