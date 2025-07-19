import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Dynamically import lovable-tagger only in development
let componentTagger: any = null;
try {
  if (process.env.NODE_ENV !== 'production') {
    componentTagger = require('lovable-tagger').componentTagger;
  }
} catch (e) {
  // Ignore if lovable-tagger is not available
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/' : '/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    ...(mode === 'development' && componentTagger ? [componentTagger()] : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
}));
