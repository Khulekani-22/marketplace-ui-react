import { promises as fs } from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const backupRoot = path.join(projectRoot, 'tools', 'vite-dist');
const targetRoot = path.join(projectRoot, 'node_modules', 'vite', 'dist');

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyMissingFiles(srcDir, destDir) {
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  await fs.mkdir(destDir, { recursive: true });
  let copied = 0;

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copied += await copyMissingFiles(srcPath, destPath);
    } else if (!(await pathExists(destPath))) {
      await fs.copyFile(srcPath, destPath);
      copied += 1;
    }
  }

  return copied;
}

async function ensureViteDist() {
  if (!(await pathExists(backupRoot))) {
    console.error('[ensure-vite-dist] Backup missing at', backupRoot);
    process.exit(1);
  }

  if (!(await pathExists(path.dirname(targetRoot)))) {
    console.error('[ensure-vite-dist] Vite package not installed at', path.dirname(targetRoot));
    process.exit(1);
  }

  const restoredCount = await copyMissingFiles(backupRoot, targetRoot);
  if (restoredCount > 0) {
    console.log(`[ensure-vite-dist] Restored ${restoredCount} Vite dist file(s) from local backup.`);
  }
}

ensureViteDist().catch((error) => {
  console.error('[ensure-vite-dist] Failed to ensure Vite dist:', error);
  process.exit(1);
});
