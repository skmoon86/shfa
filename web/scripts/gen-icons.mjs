// PWA/TWA용 아이콘 PNG 생성: public/icon-source.svg → 각 사이즈 PNG.
// 아이콘 변경 시: cd web && node scripts/gen-icons.mjs
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const pub = resolve(here, '../public')
const svg = readFileSync(resolve(pub, 'icon-source.svg'))

// any: 캔버스 그대로 / maskable: 안드로이드 어댑티브용 안전영역 패딩
const TARGETS = [
  { name: 'pwa-192.png', size: 192, maskable: false },
  { name: 'pwa-512.png', size: 512, maskable: false },
  { name: 'pwa-maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
]

const GREEN = { r: 0x4d, g: 0x93, b: 0x29, alpha: 1 }

for (const t of TARGETS) {
  if (t.maskable) {
    // 잎을 78% 크기로 줄여 가운데 배치(마스킹 잘림 방지), 배경은 그린 풀블리드
    const inner = Math.round(t.size * 0.78)
    const leaf = await sharp(svg).resize(inner, inner).png().toBuffer()
    await sharp({
      create: { width: t.size, height: t.size, channels: 4, background: GREEN },
    })
      .composite([{ input: leaf, gravity: 'center' }])
      .png()
      .toFile(resolve(pub, t.name))
  } else {
    await sharp(svg).resize(t.size, t.size).png().toFile(resolve(pub, t.name))
  }
  console.log('✓', t.name, `${t.size}x${t.size}`)
}
