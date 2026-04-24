# proxy-to-wrangler

A [Frame-Master](https://github.com/frame-master) plugin that proxies requests to a local [Wrangler](https://developers.cloudflare.com/workers/wrangler/) dev server, enabling seamless Cloudflare Workers/Pages integration during development.

## Installation

```bash
bun add proxy-to-wrangler
```

## Usage

### Forward all routes to Wrangler

```typescript
import type { FrameMasterConfig } from "frame-master/server/types";
import proxytowrangler from "proxy-to-wrangler";

export default {
  HTTPServer: { port: 3000 },
  plugins: [
    proxytowrangler({ wranglerPort: 8787 }),
  ],
} satisfies FrameMasterConfig;
```

### Forward only specific routes

```typescript
proxytowrangler({
  wranglerPort: 8787,
  proxyRoutes: ["/api/*", "/auth/*", /^\/dynamic\//],
})
```

### Spawn Wrangler automatically

Pass `wranglerCommand` to have the plugin start Wrangler for you. The plugin will wait until Wrangler is ready before the server begins accepting requests.

```typescript
proxytowrangler({
  wranglerPort: 8787,
  wranglerCommand: ["bunx", "wrangler", "dev"],
  // or for Cloudflare Pages:
  // wranglerCommand: ["bunx", "wrangler", "pages", "dev", "./functions"],
})
```

> **Note:** Do not include `--port` in `wranglerCommand` — it is appended automatically from `wranglerPort`.

## Options

| Option            | Type                   | Default     | Description                                                                 |
| ----------------- | ---------------------- | ----------- | --------------------------------------------------------------------------- |
| `wranglerPort`    | `number`               | `8787`      | Port where the Wrangler dev server listens.                                 |
| `proxyRoutes`     | `(string \| RegExp)[]` | `undefined` | Routes to forward. If omitted, **all** requests are proxied.                |
| `wranglerCommand` | `string[]`             | `undefined` | Command to spawn Wrangler. If omitted, Wrangler must be started separately. |

## Route Pattern Matching

`proxyRoutes` accepts strings and regular expressions.

| Pattern      | Matches                                 | Does not match         |
| ------------ | --------------------------------------- | ---------------------- |
| `"/api"`     | `/api` only                             | `/api/users`, `/apiv2` |
| `"/api/*"`   | `/api/`, `/api/users`                   | `/api`, `/apiv2`       |
| `"/api*"`    | `/api`, `/api/`, `/api/users`, `/apiv2` | `/other`               |
| `/^\/api\//` | `/api/anything`                         | `/api`, `/apiv2`       |

## Behavior

- Requests are forwarded to `http://127.0.0.1:{wranglerPort}` with the original method, headers, and body.
- `accept-encoding` and `content-encoding` are stripped to avoid decompression issues.
- Redirects are forwarded as-is (`redirect: "manual"`).
- If Wrangler is unreachable, a `502 Bad Gateway` response is returned.
- When `wranglerCommand` is set, the plugin polls Wrangler every 250ms (up to 30s) and exits the process if it never becomes ready.

## License

MIT
