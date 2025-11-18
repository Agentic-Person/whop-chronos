const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceIcon = path.join(__dirname, '../public/images/chronos_icon.png');
const appDir = path.join(__dirname, '../app');

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'apple-touch-icon-precomposed.png', size: 180 },
];

async function generateIcons() {
  console.log('Generating icons from:', sourceIcon);
  console.log('Output directory:', appDir);

  for (const { name, size } of sizes) {
    const outputPath = path.join(appDir, name);
    console.log(`Creating ${name} (${size}x${size})...`);

    await sharp(sourceIcon)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);

    console.log(`✓ Created ${name}`);
  }

  console.log('\n✓ All PNG icons generated successfully!');
}

generateIcons().catch(console.error);
