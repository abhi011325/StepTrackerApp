// Run: node generate-icons.js
// Generates PNG icons using canvas (requires no dependencies on modern Node)
const { createCanvas } = (() => {
  // Use a simple approach: generate a valid PNG from raw bytes
  // This creates a minimal icon with a colored background and text

  function createPNG(size) {
    // Create a simple SVG and we'll use it as a data approach
    // Instead, let's create a minimal valid PNG programmatically

    // For simplicity, we'll create an HTML file that generates the icons
    return null;
  }
  return { createCanvas: null };
})();

const fs = require('fs');
const path = require('path');

// Generate a simple SVG icon and save it, then provide instructions
const svgIcon = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#007AFF"/>
  <text x="50%" y="38%" text-anchor="middle" dominant-baseline="middle"
        font-family="-apple-system, system-ui, sans-serif" font-size="${size * 0.35}" font-weight="800" fill="white">
    500
  </text>
  <text x="50%" y="65%" text-anchor="middle" dominant-baseline="middle"
        font-family="-apple-system, system-ui, sans-serif" font-size="${size * 0.14}" font-weight="600" fill="rgba(255,255,255,0.9)">
    STEPS
  </text>
</svg>`;

// Save SVG versions (browsers handle SVG fine for PWA icons)
fs.writeFileSync(path.join(__dirname, 'icons', 'icon-192.svg'), svgIcon(192));
fs.writeFileSync(path.join(__dirname, 'icons', 'icon-512.svg'), svgIcon(512));

// Also create a simple PNG using a minimal 1-color PNG generator
function createMinimalPNG(size) {
  // We'll use the SVG as the icon - update manifest to use SVG
  return svgIcon(size);
}

console.log('SVG icons generated in icons/ folder.');
console.log('Updating manifest to use SVG icons...');

// Update manifest to use SVG
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
manifest.icons = [
  { src: 'icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
  { src: 'icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
];
fs.writeFileSync(path.join(__dirname, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('Done!');