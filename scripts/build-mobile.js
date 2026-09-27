const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'app', 'api');
const tempApiDir = path.join(rootDir, 'app', '_api_temp');
const middlewareFile = path.join(rootDir, 'middleware.js');
const tempMiddlewareFile = path.join(rootDir, '_middleware_temp.js');

let apiMoved = false;
let middlewareMoved = false;

try {
  console.log('[Mobile Build] Preparing project for static export...');

  if (fs.existsSync(apiDir)) {
    fs.renameSync(apiDir, tempApiDir);
    apiMoved = true;
    console.log('[Mobile Build] Stashed API routes.');
  }

  if (fs.existsSync(middlewareFile)) {
    fs.renameSync(middlewareFile, tempMiddlewareFile);
    middlewareMoved = true;
    console.log('[Mobile Build] Stashed middleware.');
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
    fs.renameSync(tempApiDir, apiDir);
    console.log('[Mobile Build] Restored API routes.');
  }

  if (middlewareMoved && fs.existsSync(tempMiddlewareFile)) {
    fs.renameSync(tempMiddlewareFile, middlewareFile);
    console.log('[Mobile Build] Restored middleware.');
  }
}
