import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = [react()];
  
  // Only add lovable-tagger in development and when available
  if (mode === 'development') {
    try {
      const { componentTagger } = require('lovable-tagger');
      plugins.push(componentTagger());
    } catch (e) {
      console.log('lovable-tagger not available, skipping...');
    }
  }

  return {
    base: '/',
    server: {
      host: "::",
      port: 8080,
    },
    plugins,
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
  };
});
