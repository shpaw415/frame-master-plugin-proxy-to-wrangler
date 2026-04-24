import type { FrameMasterConfig } from "frame-master/server/types";
import ProxyToWrangler from "./";

export default {
	HTTPServer: {
		port: 3001,
	},
	plugins: [
		ProxyToWrangler({
			wranglerPort: 8787,
			proxyRoutes: ["/api", "/auth/*", /^\/dynamic\//],
			wranglerCommand: ["dev", "--config", "wrangler.toml"],
		}),
		{
			name: "check-proxy-to-wrangler",
			version: "0.1.0",
			router: {
				after_request(master) {
					console.log({
						responseSetted: master.isResponseSetted(),
						pathname: new URL(master.request.url).pathname,
					});
				},
			},
		},
	],
} satisfies FrameMasterConfig;
