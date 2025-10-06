import { promises as fs } from 'node:fs';
import path from 'node:path';

const chunkName = 'dep-D_zLpgQd.js';
const projectRoot = process.cwd();
const chunkDir = path.join(projectRoot, 'node_modules', 'vite', 'dist', 'node', 'chunks');
const chunkPath = path.join(chunkDir, chunkName);
const backupPath = path.join(projectRoot, 'tools', 'vite-chunks', chunkName);

async function ensureChunk() {
  try {
    await fs.access(chunkPath);
    return;
  } catch {
    // continue to restoration
  }

  try {
    await fs.access(backupPath);
  } catch {
    console.error('[ensure-vite-chunk] Backup chunk missing at', backupPath);
    process.exit(1);
  }

  await fs.mkdir(chunkDir, { recursive: true });
  const contents = await fs.readFile(backupPath);
  await fs.writeFile(chunkPath, contents);
  console.log(`[ensure-vite-chunk] Restored ${chunkName} from local backup.`);
}

ensureChunk().catch((error) => {
  console.error('[ensure-vite-chunk] Failed to ensure Vite chunk:', error);
  process.exit(1);
});
