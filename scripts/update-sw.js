const fs = require('fs');
const path = require('path');

// Functie om service worker bij te werken met build assets
function updateServiceWorker() {
  const distPath = path.join(__dirname, '../dist');
  const swPath = path.join(distPath, 'sw.js');
  const assetsPath = path.join(distPath, 'assets');
  
  // Check if dist directory exists
  if (!fs.existsSync(distPath)) {
    console.log('❌ Dist directory not found. Run build first.');
    return;
  }
  
  // Check if service worker exists
  if (!fs.existsSync(swPath)) {
    console.log('❌ Service worker not found in dist directory.');
    return;
  }
  
  // Read current service worker
  let swContent = fs.readFileSync(swPath, 'utf8');
  
  // Find all asset files
  const assetFiles = [];
  
  if (fs.existsSync(assetsPath)) {
    const files = fs.readdirSync(assetsPath);
    files.forEach(file => {
      if (file.endsWith('.js') || file.endsWith('.css')) {
        assetFiles.push(`/assets/${file}`);
      }
    });
  }
  
  // Create updated STATIC_URLS array
  const staticUrls = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon.svg',
    '/vite.svg',
    ...assetFiles
  ];
  
  // Update service worker content
  const staticUrlsString = staticUrls.map(url => `  '${url}'`).join(',\n');
  
  // Replace STATIC_URLS in service worker
  swContent = swContent.replace(
    /const STATIC_URLS = \[[\s\S]*?\]/,
    `const STATIC_URLS = [\n${staticUrlsString}\n]`
  );
  
  // Write updated service worker
  fs.writeFileSync(swPath, swContent);
  
  console.log('✅ Service worker updated with build assets:');
  assetFiles.forEach(file => console.log(`   - ${file}`));
}

// Run the update
updateServiceWorker(); 