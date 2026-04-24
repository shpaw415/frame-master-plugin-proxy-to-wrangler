import type { FrameMasterPlugin } from "frame-master/plugin/types";
import { name, version } from "./package.json";

/**
 * Returns true if `pathname` matches the given route `pattern`.
 *
 * String patterns:
 *  - With `*`  → prefix match only (e.g. `/api*` matches `/apiv2`, `/api/x`)
 *  - Without `*` → exact match only (e.g. `/api` matches only `/api`, not `/api/users`)
 *
 * RegExp patterns are tested directly.
 */
export function matchesRoute(
	pathname: string,
	pattern: string | RegExp,
): boolean {
	if (typeof pattern === "string") {
		if (pattern.includes("*")) {
			const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
			return new RegExp("^" + escaped.replace(/\*/g, ".*")).test(pathname);
		}
		return pathname === pattern;
	}
	return pattern.test(pathname);
}

export type ProxyToWranglerProps = {
	/**
	 * Optional port number where the Wrangler server is running. Default is 8787.
	 */
	wranglerPort?: number;
	/**
	 * Optional array of route patterns to forward to the Wrangler server. If not provided, all routes will be forwarded. Patterns can be simple strings or regular expressions.
	 * Example: ["/api/*", "/auth/*", /^\/dynamic\//]
	 */
	proxyRoutes?: (string | RegExp)[];
	/**
	 * Optional command to spawn the Wrangler server.
	 * If not provided, Wrangler will not be spawned automatically and must be started separately.
	 * Example: ["dev", "--config", "wrangler.toml"] or ["pages", "dev"].
	 *
	 * **omit --port set `wranglerPort: <number>` instead**
	 */
	wranglerCommand?: string[];
};

/**
 * proxy-to-wrangler - Frame-Master Plugin
 *
 * Description: Serve as a proxy to forward requests to a Wrangler server, allowing seamless integration of Cloudflare Pages in development with Frame-Master.
 *
 * Features:
 * - Forwards incoming requests to a specified Wrangler server.
 * - Handles responses from the Wrangler server and sends them back to the client.
 */
export default function proxytowrangler(
	props: ProxyToWranglerProps,
): FrameMasterPlugin {
	const { wranglerPort = 8787, proxyRoutes, wranglerCommand } = props;
	return {
		name,
		version,
		router: {
			request: async (master) => {
				const { request: req } = master;
				const url = new URL(req.url);

				if (
					proxyRoutes &&
					!proxyRoutes.some((pattern) => matchesRoute(url.pathname, pattern))
				) {
					return;
				}

				url.port = String(wranglerPort);
				url.hostname = "127.0.0.1";
				const headers = new Headers(req.headers);
				headers.set("host", `127.0.0.1:${wranglerPort}`);
				headers.delete("accept-encoding");
				const hasBody =
					req.method !== "GET" && req.method !== "HEAD" && req.body !== null;
				try {
					const response = await fetch(url, {
						method: req.method,
						headers,
						body: hasBody ? req.body : undefined,
						redirect: "manual",
					});
					response.headers.delete("content-encoding");
					master.setResponse(response.body, {
						...response,
					});
				} catch {
					const response = new Response("Bad Gateway: upstream unavailable", {
						status: 502,
					});
					master.setResponse(response.body, {
						...response,
					});
				}
			},
		},
		async createContext() {
			if (!wranglerCommand) return;
			const wranglerProcess = Bun.spawn(
				[...wranglerCommand, "--port", String(wranglerPort)],
				{
					stdout: "inherit",
					stdin: "ignore",
					stderr: "inherit",
				},
			);
			process.on("exit", () => wranglerProcess.kill());
			process.on("SIGINT", () => {
				wranglerProcess.kill();
				process.exit();
			});
			process.on("SIGTERM", () => {
				wranglerProcess.kill();
				process.exit();
			});
			await EnsureWranglerReady(wranglerPort)
				.then(() => {
					console.log(
						`["proxy-to-wrangler"] Wrangler is ready on port ${wranglerPort}`,
					);
				})
				.catch((err) => {
					console.error(err);
					process.exit(1);
				});
		},
	};
}

async function EnsureWranglerReady(
	port: number,
	timeoutMs = 30_000,
	intervalMs = 250,
): Promise<void> {
	const url = `http://127.0.0.1:${port}/`;
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		try {
			const res = await fetch(url, { method: "HEAD" });
			if (res.status < 600) return;
		} catch {
			// not ready yet
		}
		await Bun.sleep(intervalMs);
	}
	throw new Error(
		`proxy-to-wrangler: Wrangler did not become ready on port ${port} within ${timeoutMs}ms`,
	);
}
