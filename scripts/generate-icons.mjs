// Generates the extension PNG icons (rounded gradient square + white check).
// Uses only Node built-ins (zlib) so there are no image dependencies.

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'icons');
const SIZES = [16, 32, 48, 128];

const COLOR_TOP = [102, 126, 234]; // #667eea
const COLOR_BOTTOM = [118, 75, 162]; // #764ba2
const WHITE = [255, 255, 255];

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buffer[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function roundedRectDistance(x, y, size, radius, margin) {
  const half = size / 2;
  const dx = Math.abs(x - half) - (half - margin - radius);
  const dy = Math.abs(y - half) - (half - margin - radius);
  const outsideX = Math.max(dx, 0);
  const outsideY = Math.max(dy, 0);
  return Math.sqrt(outsideX * outsideX + outsideY * outsideY) - radius;
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const lengthSq = abx * abx + aby * aby;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, (apx * abx + apy * aby) / lengthSq));
  const cx = ax + abx * t;
  const cy = ay + aby * t;
  return Math.hypot(px - cx, py - cy);
}

function checkCoverage(x, y, size) {
  const points = [
    [0.30 * size, 0.52 * size],
    [0.44 * size, 0.66 * size],
    [0.72 * size, 0.36 * size]
  ];
  const stroke = Math.max(1.2, size * 0.095);
  const d = Math.min(
    distanceToSegment(x, y, points[0][0], points[0][1], points[1][0], points[1][1]),
    distanceToSegment(x, y, points[1][0], points[1][1], points[2][0], points[2][1])
  );
  return Math.max(0, Math.min(1, stroke / 2 + 0.5 - d));
}

function makePng(size) {
  const radius = size * 0.24;
  const margin = Math.max(0.5, size * 0.04);
  const samples = 3;
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let offset = 0;

  for (let y = 0; y < size; y++) {
    raw[offset++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const px = x + (sx + 0.5) / samples;
          const py = y + (sy + 0.5) / samples;
          const inside = roundedRectDistance(px, py, size, radius, margin) <= 0;
          if (!inside) continue;

          const t = (px + py) / (size * 2);
          const grad = [
            COLOR_TOP[0] + (COLOR_BOTTOM[0] - COLOR_TOP[0]) * t,
            COLOR_TOP[1] + (COLOR_BOTTOM[1] - COLOR_TOP[1]) * t,
            COLOR_TOP[2] + (COLOR_BOTTOM[2] - COLOR_TOP[2]) * t
          ];

          const cov = checkCoverage(px, py, size);
          r += grad[0] + (WHITE[0] - grad[0]) * cov;
          g += grad[1] + (WHITE[1] - grad[1]) * cov;
          b += grad[2] + (WHITE[2] - grad[2]) * cov;
          a += 255;
        }
      }

      const total = samples * samples;
      raw[offset++] = Math.round(r / total);
      raw[offset++] = Math.round(g / total);
      raw[offset++] = Math.round(b / total);
      raw[offset++] = Math.round(a / total);
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of SIZES) {
  const file = join(OUT_DIR, `icon${size}.png`);
  writeFileSync(file, makePng(size));
  console.log(`wrote ${file}`);
}
