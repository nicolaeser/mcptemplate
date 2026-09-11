# mcptemplate

MCP Template. Stdio or HTTP at `/mcp`.

```sh
mcptemplate
mcptemplate http
```

HTTP is OAuth. Secrets stay on this host.

Env: `MCP_OAUTH_SECRET`, `MCP_PUBLIC_URL`, `MCP_AUTH_PASSWORD`.
Unset login secrets are collected on `/authorize`. Compose bind-mounts `./data` so `sessions.sqlite` survives republish.

`main` publishes GHCR `:latest`. `development` publishes `:dev`.

### Connection page

The consent page identifies the requesting application and explains this connector’s purpose.
Only account details needed for sign-in are shown upfront; optional settings expand on demand.
Server access, when required, is a separate step. Light and dark themes follow your device.
