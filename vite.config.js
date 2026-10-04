import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative asset URLs work on both a GitHub Pages project URL and a custom domain.
  base: './',
});
