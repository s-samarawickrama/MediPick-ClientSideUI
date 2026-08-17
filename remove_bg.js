const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

const IMAGE_PATHS = [
  'assets/images/cat_vitamins_bg_1785829652014.png',
  'assets/images/cat_firstaid_bg_1785829660930.png',
  'assets/images/cat_supplements_bg_1785829673928.png',
  'assets/images/cat_skincare_bg_1785829684632.png',
  'assets/prescription_and_camera.png',
  'assets/clay_3d_bag_white.png',
  'assets/medipick_3d_bag.png'
];

function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

async function removeBackground(imagePath) {
  try {
    console.log('Processing', imagePath);
    const fullPath = path.join(__dirname, imagePath);
    if (!fs.existsSync(fullPath)) {
      console.log('File not found', fullPath);
      return;
    }
    
    const image = await Jimp.read(fullPath);
    
    // Sample the corners to find the background color
    const w = image.bitmap.width;
    const h = image.bitmap.height;
    
    let rSum=0, gSum=0, bSum=0;
    const corners = [
      [0, 0], [w-1, 0], [0, h-1], [w-1, h-1],
      [w/2, 0], [w/2, h-1], [0, h/2], [w-1, h/2]
    ];
    for (const [cx, cy] of corners) {
       // Jimp v1 uses .getPixelColor
       const colorHex = image.getPixelColor(Math.floor(cx), Math.floor(cy));
       // manually extract rgba from hex (0xRRGGBBAA)
       const r = (colorHex >> 24) & 255;
       const g = (colorHex >> 16) & 255;
       const b = (colorHex >> 8) & 255;
       rSum += r; gSum += g; bSum += b;
    }
    const bgR = rSum / 8;
    const bgG = gSum / 8;
    const bgB = bSum / 8;

    const threshold = 15;
    
    image.scan(0, 0, w, h, function (x, y, idx) {
      const red   = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue  = this.bitmap.data[idx + 2];
      
      const dist = colorDistance(red, green, blue, bgR, bgG, bgB);
      if (dist < threshold) {
        this.bitmap.data[idx + 3] = 0; // Fully transparent
      } else if (dist < threshold + 15) {
        const alpha = Math.max(0, Math.min(255, (dist - threshold) * (255 / 15)));
        this.bitmap.data[idx + 3] = alpha;
      }
    });

    const outPath = fullPath.replace('.png', '_transparent.png');
    await image.write(outPath);
    console.log('Saved', outPath);
  } catch (e) {
    console.error('Error on', imagePath, e);
  }
}

async function run() {
  for (const img of IMAGE_PATHS) {
    await removeBackground(img);
  }
}

run();
