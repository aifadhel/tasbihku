import { defineConfig } from 'vite';
import fs from 'fs';

// Resolve real canonical path to handle Windows NTFS junctions (e.g. C:\AnimatorBP -> C:\Users\Animator BP)
const realCwd = fs.realpathSync(process.cwd());

export default defineConfig({
  root: realCwd,
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
