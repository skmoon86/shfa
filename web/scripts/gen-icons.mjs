// PWA/TWA용 아이콘 PNG 생성: 사용자가 만든 icon-source.jpg(너굴 얼굴, 풀블리드) → 각 사이즈 PNG.
// 아이콘 교체 시: web/public/icon-source.jpg 교체 후 → cd web && node scripts/gen-icons.mjs
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const pub = resolve(here, '../public')
const src = resolve(pub, 'icon-source.jpg')

// 원본이 정사각·풀블리드(자체 배경 포함)이므로 그대로 리사이즈.
// 얼굴이 가운데·여백 있어 maskable(어댑티브 잘림)에도 안전.
const TARGETS = [
  { name: 'pwa-192.png', size: 192 },
  { name: 'pwa-512.png', size: 512 },
  { name: 'pwa-maskable-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const t of TARGETS) {
  await sharp(src).resize(t.size, t.size, { fit: 'cover' }).png().toFile(resolve(pub, t.name))
  console.log('✓', t.name, `${t.size}x${t.size}`)
}
