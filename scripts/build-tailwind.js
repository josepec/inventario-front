#!/usr/bin/env node
/**
 * Genera src/tailwind.css con rutas absolutas (necesario en Windows con Tailwind v4).
 * Uso: node scripts/build-tailwind.js [--watch]
 */
const { execSync, spawn } = require('child_process');
const { writeFileSync } = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcApp = path.join(root, 'src', 'app').replace(/\\/g, '/');

const css = `@import "tailwindcss";
@source "${srcApp}/**/*.ts";
@source "${srcApp}/**/*.html";

@theme {
  --color-bg-base: #0d0d0d;
  --color-bg-surface: #161616;
  --color-bg-elevated: #1f1f1f;
  --color-bg-card: #1a1a1a;
  --color-border: #2a2a2a;
  --color-border-subtle: #222222;

  --color-accent: #7c3aed;
  --color-accent-hover: #6d28d9;
  --color-accent-light: #8b5cf6;
  --color-accent-muted: #7c3aed33;

  --color-text-primary: #f0f0f0;
  --color-text-secondary: #a0a0a0;
  --color-text-muted: #606060;

  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;

  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --radius-card: 0.75rem;
}
`;

writeFileSync(path.join(root, 'tailwind.input.css'), css);

const watch = process.argv.includes('--watch');
const args = ['-i', 'tailwind.input.css', '-o', 'src/tailwind.css'];
if (watch) args.push('--watch');

const tw = path.join(root, 'node_modules', '.bin', 'tailwindcss');

if (watch) {
  spawn(tw, args, { stdio: 'inherit', shell: true });
} else {
  execSync(`"${tw}" ${args.join(' ')}`, { stdio: 'inherit', cwd: root });
}
