---
name: Generated API client TypeScript libs
description: Orval-generated fetch helpers require iterable DOM types during workspace library typechecking.
---

The shared TypeScript compiler configuration must include `dom.iterable` anywhere the generated API client is compiled, because its header serialization uses `Headers.entries()`.

**Why:** Code generation succeeds but the chained workspace typecheck fails without the iterable DOM declarations.

**How to apply:** Keep `dom.iterable` in the shared base or API client library `lib` settings when regenerating the client.