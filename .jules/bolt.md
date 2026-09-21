## 2025-05-18 - Stream Chunk Checking & Collector Cleanup Overhead
**Learning:** `Buffer.isBuffer(chunk)` adds unnecessary function call overhead per stream chunk compared to checking `typeof chunk === 'string'`. Also, cleaning up stream event listeners without guarding against duplicate invocation during stream end/close events performs redundant `removeListener` calls.
**Action:** Use `typeof chunk === 'string' ? Buffer.from(chunk) : chunk` for chunk conversions and guard stream `cleanup()` functions with an `isCleanedUp` flag.
