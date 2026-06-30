// MeteoNook(© 2020 Ash Wolf "Ninji", AGPL-3.0) 파생. 저장소 루트 LICENSE 참조.
// 날짜 → 시드 변환 (MeteoNook src/lib.rs compute_seed_ymd / compute_seed_ymdh).
// base|0x80000000 은 JS에서 음수가 되므로 반드시 >>>0. wrapping_add 는 (a+b)>>>0.

export function computeSeedYmd(
  base: number,
  yMul: number,
  mMul: number,
  dMul: number,
  year: number,
  month: number,
  day: number,
): number {
  let s = (base | 0x80000000) >>> 0
  s = (s + (Math.imul(yMul, year) >>> 0)) >>> 0
  s = (s + (Math.imul(mMul, month) >>> 0)) >>> 0
  s = (s + (Math.imul(dMul, day) >>> 0)) >>> 0
  return s
}

export function computeSeedYmdh(
  base: number,
  yMul: number,
  mMul: number,
  dMul: number,
  hMul: number,
  year: number,
  month: number,
  day: number,
  hour: number,
): number {
  const s = computeSeedYmd(base, yMul, mMul, dMul, year, month, day)
  return (s + (Math.imul(hMul, hour) >>> 0)) >>> 0
}
