const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'app', 'api');
const tempApiDir = path.join(rootDir, 'app', '_api_temp');
const middlewareFile = path.join(rootDir, 'middleware.js');
const tempMiddlewareFile = path.join(rootDir, '_middleware_temp.js');

function safeMove(src, dest) {
  try {
    fs.renameSync(src, dest);
    return true;
  } catch (err) {
    // Fallback: copy and delete
    try {
      if (fs.statSync(src).isDirectory()) {
        fs.cpSync(src, dest, { recursive: true });
        fs.rmSync(src, { recursive: true, force: true });
      } else {
        fs.copyFileSync(src, dest);
        fs.unlinkSync(src);
      }
      return true;
    } catch (fallbackErr) {
      throw err;
    }
  }
}

let apiMoved = false;
let middlewareMoved = false;

try {
  console.log('[Mobile Build] Preparing project for static export...');

  if (fs.existsSync(apiDir)) {
    safeMove(apiDir, tempApiDir);
    apiMoved = true;
    console.log('[Mobile Build] Stashed API routes.');
  }

  if (fs.existsSync(middlewareFile)) {
    safeMove(middlewareFile, tempMiddlewareFile);
    middlewareMoved = true;
    console.log('[Mobile Build] Stashed middleware.');
  }
  // Clean .next cache to ensure clean static export
  const nextCacheDir = path.join(rootDir, '.next');
  if (fs.existsSync(nextCacheDir)) {
    try {
      fs.rmSync(nextCacheDir, { recursive: true, force: true });
    } catch (e) {}
  }

  console.log('[Mobile Build] Running Next.js static export...');
  execSync('npx next build', {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      CAPACITOR_EXPORT: 'true',
    },
  });

  console.log('[Mobile Build] Static export successfully generated in /out');
} catch (error) {
  console.error('[Mobile Build] Build failed:', error);
  process.exitCode = 1;
} finally {
  if (apiMoved && fs.existsSync(tempApiDir)) {
    try {
      safeMove(tempApiDir, apiDir);
      console.log('[Mobile Build] Restored API routes.');
    } catch (e) {
      console.error('[Mobile Build] Warning: failed to restore API routes automatically:', e.message);
    }
  }

  if (middlewareMoved && fs.existsSync(tempMiddlewareFile)) {
    try {
      safeMove(tempMiddlewareFile, middlewareFile);
      console.log('[Mobile Build] Restored middleware.');
    } catch (e) {
      console.error('[Mobile Build] Warning: failed to restore middleware automatically:', e.message);
    }
  }
}
