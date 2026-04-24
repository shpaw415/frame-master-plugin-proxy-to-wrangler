import type { FrameMasterPlugin } from "frame-master/plugin/types";
import { name, version } from "./package.json";

export type ProxyToWranglerProps = {
	wranglerPort?: number;
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
	const { wranglerPort = 8787 } = props;
	return {
		name,
		version,
		router: {
			request: async (master) => {
				const { request: req } = master;
				const url = new URL(req.url);
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
	};
}
