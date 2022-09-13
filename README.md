# HNSD.js

Want to use handshake protocol in your app, but don't want user to install any software besides your? Now you can builtin HNSD binaries with JS interface to your project easily!
As easy as that:
```js
import HNSDResolver from "hnsd.js";
let resolver = new HNSDResolver();
await resolver.launch();
resolver.height // Sync height of your HNSD
resolver.recursivePort // Recursive port of your HNSD node (host is always 127.0.0.1)
resolver.authoritativePort // Root-only port of your HNSD node (host is always 127.0.0.1)
resolver.rootResolver // Already configured to HNSD's authoritative port BNS's Resolver instance
resolver.recursiveResolver // Already configured to HNSD's recursive port BNS's Resolver instance
```