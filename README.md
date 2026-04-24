# proxy-to-wrangler

Frame-Master plugin

## Installation

```bash
bun add proxy-to-wrangler
```

## Usage

```typescript
import type { FrameMasterConfig } from "frame-master/server/types";
import proxytowrangler from "proxy-to-wrangler";

const config: FrameMasterConfig = {
  HTTPServer: { port: 3000 },
  plugins: [proxytowrangler()],
};

export default config;
```

## Features

- Feature 1
- Feature 2

## License

MIT

```

```
