import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';

// The examples live outside this app's root, so React would otherwise resolve
// twice — once from sandbox/node_modules, once from the repo root.
const local = (id: string) => fileURLToPath(new URL(`node_modules/${id}`, import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: { fs: { allow: ['..'] } },
  resolve: {
    dedupe: ['react', 'react-dom', 'lit', '@lit/reactive-element', 'lit-html'],
    alias: {
      react: local('react'),
      'react-dom': local('react-dom'),
      '@vaadin': local('@vaadin'),
    },
  },
});
