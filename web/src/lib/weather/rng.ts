// ─────────────────────────────────────────────────────────────────────────
// 본 파일을 포함한 web/src/lib/weather/* 는 MeteoNook(© 2020 Ash Wolf "Ninji",
// github.com/Treeki/MeteoNook)의 ACNH 날씨 알고리즘을 옮긴 파생물이며 AGPL-3.0
// 라이선스를 따릅니다. 전체 라이선스 전문은 저장소 루트의 LICENSE 파일 참조.
// ─────────────────────────────────────────────────────────────────────────
// ACNH 날씨 RNG — sead::Random 포팅 (MeteoNook src/lib.rs).
// Rust u32 wrapping 연산을 JS로 옮긴 것: 곱셈은 Math.imul, 모든 결과는 >>>0(부호없는 u32),
// 우측 시프트는 >>>. (한 곳만 틀려도 전체 예보가 조용히 깨지므로 그대로 유지할 것.)

export class Random {
  a = 0
  b = 0
  c = 0
  d = 0

  static withSeed(seed: number): Random {
    const r = new Random()
    r.init(seed)
    return r
  }

  static withState(a: number, b: number, c: number, d: number): Random {
    const r = new Random()
    r.a = a >>> 0
    r.b = b >>> 0
    r.c = c >>> 0
    r.d = d >>> 0
    return r
  }

  init(seed: number): void {
    const mult = 0x6c078965
    seed = seed >>> 0
    this.a = (Math.imul((seed ^ (seed >>> 30)) >>> 0, mult) + 1) >>> 0
    this.b = (Math.imul((this.a ^ (this.a >>> 30)) >>> 0, mult) + 2) >>> 0
    this.c = (Math.imul((this.b ^ (this.b >>> 30)) >>> 0, mult) + 3) >>> 0
    this.d = (Math.imul((this.c ^ (this.c >>> 30)) >>> 0, mult) + 4) >>> 0
  }

  roll(): number {
    const n = (this.a ^ (this.a << 11)) >>> 0
    this.a = this.b
    this.b = this.c
    this.c = this.d
    this.d = (n ^ (n >>> 8) ^ this.d ^ (this.d >>> 19)) >>> 0
    return this.d
  }

  // (roll() * limit) >> 32. roll()<2^32, limit<=255 ⇒ 곱 < 2^53 ⇒ BigInt 불필요.
  rollMax(limit: number): number {
    return Math.floor((this.roll() * limit) / 0x100000000)
  }
  rollMax8(limit: number): number {
    return this.rollMax(limit)
  }
}
