import type { FrameMasterConfig } from "frame-master/server/types";
import ProxyToWrangler from "../";

export default {
	HTTPServer: {
		port: 3001,
	},
	plugins: [
		ProxyToWrangler({
			wranglerPort: 8787,
			proxyRoutes: ["/*"],
			wranglerCommand: ["wrangler", "pages", "dev"],
		}),
	],
} satisfies FrameMasterConfig;
