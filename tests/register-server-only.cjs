// Node's test runner has no React Server Component layer. Mock only its import
// marker; production continues to enforce the real server-only package.
const marker = require.resolve('server-only');
require.cache[marker] = { id: marker, filename: marker, loaded: true, exports: {} };
