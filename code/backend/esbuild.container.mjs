/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
import { build } from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'

// Add build timestamp to help with cache invalidation
const BUILD_TIMESTAMP = new Date().toISOString()
console.log(`Build timestamp: ${BUILD_TIMESTAMP}`)

try {
  await build({
    entryPoints: ['src/container/server.ts'],
    outdir: 'dist/container', // Changed from 'dist' to 'dist/container' to preserve directory structure
    bundle: true,
    minify: true,
    platform: 'node',
    target: 'node22',
    format: 'esm',
    sourcemap: true,
    banner: {
      js: `// Build: ${BUILD_TIMESTAMP}\nimport { createRequire } from 'module'; const require = createRequire(import.meta.url);`
    },
    plugins: [],
    outExtension: {
      '.js': '.js'
    },
    logLevel: 'info'
  })
} catch (error) {
  process.exit(1)
}
