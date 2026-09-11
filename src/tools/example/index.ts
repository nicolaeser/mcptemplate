import { z } from "zod";
import { defineTool, runTool } from "../../mcp/define-tool.js";

export const tools = [
  defineTool(
    "template_whoami",
    "Who am I",
    "Show the non-secret login claims for this MCP session. Secrets are never returned.",
    z.object({}),
    (ctx) =>
      runTool(ctx, async () => ({
        accountLabel: ctx.bag.claims.accountLabel ?? null,
        region: ctx.bag.claims.region ?? null,
        hasUpstreamToken: ctx.token.length > 0
      }))
  ),
  defineTool(
    "template_ping",
    "Ping",
    "Health check tool that does not call any upstream API.",
    z.object({ message: z.string().optional() }),
    (ctx, input) =>
      runTool(ctx, async () => ({
        pong: input.message ?? "ok",
        region: ctx.bag.claims.region ?? null
      }))
  ),
  defineTool(
    "template_get",
    "GET JSON",
    "Example upstream GET through axios. Clones replace this with vendor methods. Path must start with /.",
    z.object({
      path: z.string().default("/").describe("Same-origin path, for example /status")
    }),
    (ctx, input) => runTool(ctx, () => ctx.client.getJson(input.path))
  )
];
