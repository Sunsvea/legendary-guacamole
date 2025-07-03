// Simple script to create placeholder PWA icons
// In production, you would use proper icon generation tools

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate simple SVG icons for each size
sizes.forEach(size => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" fill="url(#mountainGradient)" stroke="#1e3a8a" stroke-width="4"/>
  
  <!-- Mountain peaks -->
  <path d="M${size*0.15} ${size*0.65} L${size*0.3} ${size*0.35} L${size*0.45} ${size*0.5} L${size*0.6} ${size*0.25} L${size*0.75} ${size*0.45} L${size*0.85} ${size*0.65} Z" fill="#ffffff" opacity="0.9"/>
  
  <!-- Route line -->
  <path d="M${size*0.2} ${size*0.7} Q${size*0.35} ${size*0.45} ${size*0.5} ${size*0.55} T${size*0.8} ${size*0.4}" fill="none" stroke="#fbbf24" stroke-width="${Math.max(2, size/40)}" stroke-linecap="round" opacity="0.8"/>
  <circle cx="${size*0.2}" cy="${size*0.7}" r="${Math.max(1, size/50)}" fill="#fbbf24"/>
  <circle cx="${size*0.8}" cy="${size*0.4}" r="${Math.max(1, size/50)}" fill="#fbbf24"/>
  
  <!-- Waypoint -->
  <circle cx="${size*0.5}" cy="${size*0.55}" r="${Math.max(1, size/70)}" fill="#fbbf24" opacity="0.6"/>
</svg>`;

  const filename = path.join(iconsDir, `icon-${size}x${size}.png`);
  
  // Note: This creates SVG files with PNG extension for simplicity
  // In production, you'd use a proper image conversion tool
  fs.writeFileSync(filename.replace('.png', '.svg'), svg);
  
  console.log(`Generated icon: ${size}x${size}`);
});

console.log('Icon generation complete!');
console.log('Note: Generated SVG files. For production PWA, convert these to PNG format.');
console.log('You can use tools like ImageMagick or online converters to create actual PNG files.');