import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Resolve real canonical path to handle Windows NTFS junctions (e.g. C:\AnimatorBP -> C:\Users\Animator BP)
const realCwd = fs.realpathSync(process.cwd());

function swPrecacheManifestPlugin() {
  return {
    name: 'sw-precache-manifest',
    closeBundle() {
      const distDir = path.join(realCwd, 'dist');
      const swPath = path.join(distDir, 'sw.js');
      const assetsDir = path.join(distDir, 'assets');
      if (!fs.existsSync(swPath) || !fs.existsSync(assetsDir)) return;

      const assetUrls = fs.readdirSync(assetsDir)
        .filter((f) => f.endsWith('.js') || f.endsWith('.css'))
        .sort()
        .map((f) => `/assets/${f}`);

      const baseUrls = [
        '/',
        '/index.html',
        '/404.html',
        '/manifest.json',
        '/favicon.ico',
        '/icon-192.png',
        '/icon-512.png',
        '/config.json',
        '/sound.ogg'
      ];
      const allUrls = [...baseUrls, ...assetUrls];
      const swSrc = fs.readFileSync(swPath, 'utf8');
      const updated = swSrc.replace(
        /const urlsToCache = \[[\s\S]*?\];/,
        `const urlsToCache = ${JSON.stringify(allUrls, null, 2)};`
      );
      fs.writeFileSync(swPath, updated, 'utf8');
    }
  };
}

export default defineConfig({
  root: realCwd,
  plugins: [swPrecacheManifestPlugin()],
  server: {
    port: 3005,
    open: false,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
});
