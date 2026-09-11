import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readRuntimeConfig } from "../config.js";
import { createMcpServer } from "../mcp/server.js";
import { defaultClientFactory } from "../upstream/client.js";
import { PACKAGE_NAME, PACKAGE_VERSION } from "../version.js";

export interface StdioRunOptions {
  readonly env?: NodeJS.ProcessEnv;
}

export async function runStdio(options: StdioRunOptions = {}): Promise<void> {
  const env = options.env ?? process.env;
  const config = readRuntimeConfig(env);
  const token = config.apiToken ?? env.UPSTREAM_API_TOKEN;
  const server = createMcpServer({
    createClient: defaultClientFactory,
    getToken: () => token,
    ...(config.baseURL === undefined ? {} : { baseURL: config.baseURL }),
    getBag: () => ({
      secrets: token === undefined ? {} : { apiToken: token },
      claims: config.baseURL === undefined ? {} : { baseURL: config.baseURL }
    })
  });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`${PACKAGE_NAME}/${PACKAGE_VERSION} listening on stdio\n`);
}
