// eslint-disable-next-line @typescript-eslint/no-require-imports
const { spawn } = require('node:child_process');

const port = process.env.NEXT_PORT || process.env.PORT || '3000';
const url = process.env.INNGEST_URL || `http://localhost:${port}/api/inngest`;

const child = spawn('npx', ['inngest-cli@1.16.1', 'dev', '-u', url], {
  stdio: 'inherit',
  shell: true,
});

child.on('error', (error) => {
  console.error('[dev:inngest] Failed to start Inngest CLI', error);
  process.exit(1);
});

child.on('close', (code) => {
  if (code !== 0) {
    console.error(`[dev:inngest] Inngest CLI exited with code ${code}`);
    process.exit(code ?? 1);
  }
});

