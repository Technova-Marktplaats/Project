import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue(),
  ],
  publicDir: 'public',
  // Optional: Define base if deploying to a subdirectory
  base: '/', // Change to '/marktplaats/' if deploying to a subdirectory
  build: {
    rollupOptions: {
      input: {
        main: 'index.html', // Explicitly set, but usually not needed
      },
    },
  },
});
