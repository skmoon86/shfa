// ACNH 날씨 예보 엔진 — MeteoNook src/lib.rs + js/model.ts 포팅.
// 섬 날씨 시드 + 반구 + 날짜로 시간별 날씨와 별똥별·무지개·오로라·안개·눈·바람을 결정적으로 계산.
// ⚠ 특수 구름(special clouds)은 게임 v2.0 이후 라이브 사이트(MeteoNook)에서도 표시하지 않으므로 미구현.
import { Random } from './rng'
import { computeSeedYmd, computeSeedYmdh } from './seed'
import {
  RATE_LOOKUP_N,
  RATE_LOOKUP_S,
  RATE_MAPS,
  PATTERNS,
  WINDS,
  EASTER_DAYS,
  EASTER_MONTHS,
  AUGUST_SUNDAYS,
  FISH_CON_JAN,
  FISH_CON_APR,
  FISH_CON_JUL,
  FISH_CON_OCT,
  INSECT_CON_JUN_N,
  INSECT_CON_JUL_N,
  INSECT_CON_AUG_N,
  INSECT_CON_SEP_N,
  INSECT_CON_JAN_S,
  INSECT_CON_FEB_S,
  INSECT_CON_NOV_S,
  INSECT_CON_DEC_S,
} from './data'

// ── enums (원본 값 유지) — tsconfig erasableSyntaxOnly 때문에 enum 대신 const 객체 + 타입 별칭 ──
export const Hemisphere = { Northern: 0, Southern: 1 } as const
export type Hemisphere = (typeof Hemisphere)[keyof typeof Hemisphere]

export const Weather = { Clear: 0, Sunny: 1, Cloudy: 2, RainClouds: 3, Rain: 4, HeavyRain: 5 } as const
export type Weather = (typeof Weather)[keyof typeof Weather]

export const WindType = { Calm: 0, Land0: 1, Land1: 2, Land2: 3, Sea0: 4, Sea1: 5, Sea2: 6 } as const
export type WindType = (typeof WindType)[keyof typeof WindType]

export const SpecialDay = { None: 0, Easter: 1, FishCon: 2, InsectCon: 3, Countdown: 4, Fireworks: 5 } as const
export type SpecialDay = (typeof SpecialDay)[keyof typeof SpecialDay]

export const SnowLevel = { None: 0, Low: 1, Full: 2 } as const
export type SnowLevel = (typeof SnowLevel)[keyof typeof SnowLevel]

export const SpWeatherLevel = { None: 0, Rainbow: 1, Aurora: 2 } as const
export type SpWeatherLevel = (typeof SpWeatherLevel)[keyof typeof SpWeatherLevel]

export const FogLevel = { None: 0, HeavyAndWater: 1, WaterOnly: 2 } as const
export type FogLevel = (typeof FogLevel)[keyof typeof FogLevel]

export const Constellation = {
  Capricorn: 0, Aquarius: 1, Pisces: 2, Aries: 3, Taurus: 4, Gemini: 5,
  Cancer: 6, Leo: 7, Virgo: 8, Libra: 9, Scorpio: 10, Sagittarius: 11,
} as const
export type Constellation = (typeof Constellation)[keyof typeof Constellation]

export const Pattern = {
  Fine00: 0, Fine01: 1, Fine02: 2, Fine03: 3, Fine04: 4, Fine05: 5, Fine06: 6,
  Cloud00: 7, Cloud01: 8, Cloud02: 9,
  Rain00: 10, Rain01: 11, Rain02: 12, Rain03: 13, Rain04: 14, Rain05: 15,
  FineCloud00: 16, FineCloud01: 17, FineCloud02: 18,
  CloudFine00: 19, CloudFine01: 20, CloudFine02: 21,
  FineRain00: 22, FineRain01: 23, FineRain02: 24, FineRain03: 25,
  CloudRain00: 26, CloudRain01: 27, CloudRain02: 28,
  RainCloud00: 29, RainCloud01: 30, RainCloud02: 31,
  Commun00: 32, EventDay00: 33,
} as const
export type Pattern = (typeof Pattern)[keyof typeof Pattern]

export const PATTERN_NAMES = [
  'Fine00', 'Fine01', 'Fine02', 'Fine03', 'Fine04', 'Fine05', 'Fine06',
  'Cloud00', 'Cloud01', 'Cloud02',
  'Rain00', 'Rain01', 'Rain02', 'Rain03', 'Rain04', 'Rain05',
  'FineCloud00', 'FineCloud01', 'FineCloud02',
  'CloudFine00', 'CloudFine01', 'CloudFine02',
  'FineRain00', 'FineRain01', 'FineRain02', 'FineRain03',
  'CloudRain00', 'CloudRain01', 'CloudRain02',
  'RainCloud00', 'RainCloud01', 'RainCloud02',
  'Commun00', 'EventDay00',
]

export const PatternKind = {
  Fine: 0, Cloud: 1, Rain: 2, FineCloud: 3, CloudFine: 4,
  FineRain: 5, CloudRain: 6, RainCloud: 7, Commun: 8, EventDay: 9,
} as const
export type PatternKind = (typeof PatternKind)[keyof typeof PatternKind]

export function patternKind(p: Pattern): PatternKind {
  if (p <= Pattern.Fine06) return PatternKind.Fine
  if (p <= Pattern.Cloud02) return PatternKind.Cloud
  if (p <= Pattern.Rain05) return PatternKind.Rain
  if (p <= Pattern.FineCloud02) return PatternKind.FineCloud
  if (p <= Pattern.CloudFine02) return PatternKind.CloudFine
  if (p <= Pattern.FineRain03) return PatternKind.FineRain
  if (p <= Pattern.CloudRain02) return PatternKind.CloudRain
  if (p <= Pattern.RainCloud02) return PatternKind.RainCloud
  if (p === Pattern.Commun00) return PatternKind.Commun
  return PatternKind.EventDay
}

export const patternName = (p: Pattern): string => PATTERN_NAMES[p]

// ── 날짜/시각 헬퍼 ───────────────────────────────────────────
const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

export function getMonthLength(year: number, month: number): number {
  const leap = (year & 3) === 0
  return leap && month === 2 ? 29 : MONTH_LENGTHS[month - 1]
}

function getNextDay(year: number, month: number, day: number): [number, number, number] {
  day += 1
  if (day > getMonthLength(year, month)) {
    month += 1
    day = 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }
  return [year, month, day]
}

// 게임일은 05시 시작 → 00~04시는 전날에 귀속.
function normaliseLateYmd(year: number, month: number, day: number, hour: number): [number, number, number] {
  return hour < 5 ? getNextDay(year, month, day) : [year, month, day]
}

// linear hour(0=19시…) ↔ clock hour
export function fromLinearHour(lh: number): number {
  return lh < 5 ? 19 + lh : lh - 5
}
export function toLinearHour(hour: number): number {
  return hour >= 19 ? hour - 19 : hour + 5
}

export function getConstellation(month: number, day: number): Constellation {
  const C = Constellation
  const md = month * 100 + day
  if (md <= 119) return C.Capricorn
  if (md <= 131) return C.Aquarius
  if (md <= 218) return C.Aquarius
  if (md <= 229) return C.Pisces
  if (md <= 320) return C.Pisces
  if (md <= 331) return C.Aries
  if (md <= 419) return C.Aries
  if (md <= 430) return C.Taurus
  if (md <= 520) return C.Taurus
  if (md <= 531) return C.Gemini
  if (md <= 621) return C.Gemini
  if (md <= 630) return C.Cancer
  if (md <= 722) return C.Cancer
  if (md <= 731) return C.Leo
  if (md <= 822) return C.Leo
  if (md <= 831) return C.Virgo
  if (md <= 922) return C.Virgo
  if (md <= 930) return C.Libra
  if (md <= 1023) return C.Libra
  if (md <= 1031) return C.Scorpio
  if (md <= 1122) return C.Scorpio
  if (md <= 1130) return C.Sagittarius
  if (md <= 1221) return C.Sagittarius
  return C.Capricorn
}

// ── 특수일 ───────────────────────────────────────────────────
export function isSpecialDay(hemi: Hemisphere, year: number, month: number, day: number): SpecialDay {
  if (year >= 2000 && year <= 2060) {
    const i = year - 2000
    if (year === 2020 && month === EASTER_MONTHS[i] && day === EASTER_DAYS[i]) return SpecialDay.Easter
    if (month === 1 && day === FISH_CON_JAN[i]) return SpecialDay.FishCon
    if (month === 4 && day === FISH_CON_APR[i]) return SpecialDay.FishCon
    if (month === 7 && day === FISH_CON_JUL[i]) return SpecialDay.FishCon
    if (month === 10 && day === FISH_CON_OCT[i]) return SpecialDay.FishCon
    if (hemi === Hemisphere.Northern) {
      if (month === 6 && day === INSECT_CON_JUN_N[i]) return SpecialDay.InsectCon
      if (month === 7 && day === INSECT_CON_JUL_N[i]) return SpecialDay.InsectCon
      if (month === 8 && day === INSECT_CON_AUG_N[i]) return SpecialDay.InsectCon
      if (month === 9 && day === INSECT_CON_SEP_N[i]) return SpecialDay.InsectCon
    } else {
      if (month === 1 && day === INSECT_CON_JAN_S[i]) return SpecialDay.InsectCon
      if (month === 2 && day === INSECT_CON_FEB_S[i]) return SpecialDay.InsectCon
      if (month === 11 && day === INSECT_CON_NOV_S[i]) return SpecialDay.InsectCon
      if (month === 12 && day === INSECT_CON_DEC_S[i]) return SpecialDay.InsectCon
    }
    if (month === 8 && ((day - 1) % 7) + 1 === AUGUST_SUNDAYS[i]) return SpecialDay.Fireworks
  }
  if (month === 12 && day === 31) return SpecialDay.Countdown
  return SpecialDay.None
}

// ── 계절 레벨 (반구별 날짜 구간) ─────────────────────────────
const between = (d: number, lo: number, hi: number) => d >= lo && d <= hi

export function getSnowLevel(hemi: Hemisphere, month: number, day: number): SnowLevel {
  if (hemi === Hemisphere.Northern) {
    if (month === 11 && between(day, 26, 30)) return SnowLevel.Low
    if (month === 12 && between(day, 1, 10)) return SnowLevel.Low
    if (month === 12 && between(day, 11, 31)) return SnowLevel.Full
    if (month === 1) return SnowLevel.Full
    if (month === 2 && between(day, 1, 24)) return SnowLevel.Full
  } else {
    if (month === 5 && between(day, 26, 31)) return SnowLevel.Low
    if (month === 6 && between(day, 1, 10)) return SnowLevel.Low
    if (month === 6 && between(day, 11, 30)) return SnowLevel.Full
    if (month === 7) return SnowLevel.Full
    if (month === 8 && between(day, 1, 24)) return SnowLevel.Full
  }
  return SnowLevel.None
}

export function getSpWeatherLevel(hemi: Hemisphere, month: number, day: number): SpWeatherLevel {
  if (hemi === Hemisphere.Northern) {
    if (month === 12 && between(day, 11, 31)) return SpWeatherLevel.Aurora
    if (month === 1) return SpWeatherLevel.Aurora
    if (month === 2 && between(day, 1, 24)) return SpWeatherLevel.Aurora
    if (month === 2 && between(day, 25, 29)) return SpWeatherLevel.Rainbow
    if (month >= 3 && month <= 10) return SpWeatherLevel.Rainbow
    if (month === 11 && between(day, 1, 25)) return SpWeatherLevel.Rainbow
  } else {
    if (month === 6 && between(day, 11, 30)) return SpWeatherLevel.Aurora
    if (month === 7) return SpWeatherLevel.Aurora
    if (month === 8 && between(day, 1, 24)) return SpWeatherLevel.Aurora
    if (month === 8 && between(day, 25, 31)) return SpWeatherLevel.Rainbow
    if (month >= 9 && month <= 12) return SpWeatherLevel.Rainbow
    if (month >= 1 && month <= 4) return SpWeatherLevel.Rainbow
    if (month === 5 && between(day, 1, 25)) return SpWeatherLevel.Rainbow
  }
  return SpWeatherLevel.None
}

export function getFogLevel(hemi: Hemisphere, month: number, day: number): FogLevel {
  if (hemi === Hemisphere.Northern) {
    if (month === 9 && between(day, 21, 30)) return FogLevel.HeavyAndWater
    if (month >= 10 && month <= 12) return FogLevel.HeavyAndWater
    if (month === 1) return FogLevel.HeavyAndWater
    if (month === 2 && between(day, 1, 24)) return FogLevel.HeavyAndWater
    if (month === 2 && between(day, 25, 29)) return FogLevel.WaterOnly
    if (month === 3) return FogLevel.WaterOnly
  } else {
    if (month === 3 && between(day, 21, 31)) return FogLevel.HeavyAndWater
    if (month >= 4 && month <= 7) return FogLevel.HeavyAndWater
    if (month === 8 && between(day, 1, 24)) return FogLevel.HeavyAndWater
    if (month === 8 && between(day, 25, 31)) return FogLevel.WaterOnly
    if (month === 9) return FogLevel.WaterOnly
  }
  return FogLevel.None
}

export function checkWaterFog(seed: number, year: number, month: number, day: number): boolean {
  const rng = Random.withState((year << 8) >>> 0, (month << 8) >>> 0, (day << 8) >>> 0, (seed | 0x80000000) >>> 0)
  rng.roll()
  rng.roll()
  return (rng.roll() & 1) === 1
}

// ── 패턴 / 날씨 ──────────────────────────────────────────────
export function getPattern(hemi: Hemisphere, seed: number, year: number, month: number, day: number): Pattern {
  if (isSpecialDay(hemi, year, month, day) !== SpecialDay.None) return Pattern.EventDay00
  const s = computeSeedYmd(seed, 0x2000000, 0x200000, 0x10000, year, month, day)
  const rng = Random.withSeed(s)
  rng.roll()
  rng.roll()
  const lookup = hemi === Hemisphere.Northern ? RATE_LOOKUP_N : RATE_LOOKUP_S
  const rateSet = lookup[month - 1][day - 1]
  return RATE_MAPS[rateSet][rng.rollMax(100)] as Pattern
}

export function getWeather(hour: number, pattern: Pattern): Weather {
  return PATTERNS[pattern][hour] as Weather
}

export function isHeavyShowerPattern(p: Pattern): boolean {
  return p === Pattern.Fine00
}
export function isLightShowerPattern(p: Pattern): boolean {
  return p === Pattern.Fine02 || p === Pattern.Fine04 || p === Pattern.Fine06
}

export function isAuroraPattern(hemi: Hemisphere, month: number, day: number, pattern: Pattern): boolean {
  if (getSpWeatherLevel(hemi, month, day) !== SpWeatherLevel.Aurora) return false
  return pattern === Pattern.Fine01 || pattern === Pattern.Fine03 || pattern === Pattern.Fine05
}

export interface RainbowInfo {
  count: number // 0 = 없음, 1 = 무지개, 2 = 쌍무지개
  hour: number
}
export function getRainbowInfo(
  hemi: Hemisphere,
  seed: number,
  year: number,
  month: number,
  day: number,
  pattern: Pattern,
): RainbowInfo {
  if (getSpWeatherLevel(hemi, month, day) === SpWeatherLevel.Rainbow) {
    const k = patternKind(pattern)
    if (k === PatternKind.CloudFine || k === PatternKind.FineRain) {
      const s = computeSeedYmd(seed, 0x1000000, 0x40000, 0x1000, year, month, day)
      const rng = Random.withSeed(s)
      rng.roll()
      rng.roll()
      const count = (rng.roll() & 1) === 0 ? 1 : 2
      for (let h = 7; h <= 17; h++) {
        const a = PATTERNS[pattern][h]
        const b = PATTERNS[pattern][h + 1]
        if ((a === Weather.Rain || a === Weather.HeavyRain) && (b === Weather.Clear || b === Weather.Sunny)) {
          return { count, hour: h + 1 }
        }
      }
    }
  }
  return { count: 0, hour: 0 }
}

// ── 바람 ─────────────────────────────────────────────────────
export function getWindPower(seed: number, year: number, month: number, day: number, hour: number, pattern: Pattern): number {
  const [ny, nm, nd] = normaliseLateYmd(year, month, day, hour)
  const s = computeSeedYmdh(seed, 0x2000000, 0x200000, 0x10000, 1, ny, nm, nd, hour)
  const rng = Random.withSeed(s)
  rng.roll()
  rng.roll()
  switch (WINDS[pattern][hour] as WindType) {
    case WindType.Calm:
      return 0
    case WindType.Land0:
    case WindType.Sea0:
      return rng.rollMax8(3)
    case WindType.Land1:
    case WindType.Sea1:
      return rng.rollMax8(4) + 1
    case WindType.Land2:
    case WindType.Sea2:
      return rng.rollMax8(3) + 3
  }
  return 0
}

// ── 별똥별 ───────────────────────────────────────────────────
export function canHaveShootingStars(hour: number, pattern: Pattern): boolean {
  if (hour >= 19 || hour < 4) {
    return (
      pattern === Pattern.Fine00 ||
      pattern === Pattern.Fine02 ||
      pattern === Pattern.Fine04 ||
      pattern === Pattern.Fine06
    )
  }
  return false
}

// 분당 별똥별 초 배열(오름차순). 없으면 null.
function queryStarsInternal(seedBase: number, minute: number, pattern: Pattern): number[] | null {
  const rng = Random.withSeed((seedBase + (Math.imul(minute, 0x100) >>> 0)) >>> 0)
  let starCount: number
  if (pattern === Pattern.Fine00) {
    if (rng.rollMax(100) >= 50) return null
    starCount = rng.rollMax(100) < 50 ? 8 : 5
  } else if (pattern === Pattern.Fine02 || pattern === Pattern.Fine04 || pattern === Pattern.Fine06) {
    const chance = (minute & 1) === 0 ? 2 : 4
    if (rng.rollMax(60) >= chance) return null
    starCount = 5
  } else {
    return null
  }
  const used = new Set<number>()
  let remaining = starCount
  while (remaining > 0) {
    const bit = rng.rollMax(60)
    if (!used.has(bit)) {
      used.add(bit)
      remaining -= 1
    }
  }
  return Array.from(used).sort((a, b) => a - b)
}

export interface StarInfo {
  hour: number
  minute: number
  seconds: number[]
}

function dayStars(seed: number, year: number, month: number, day: number, hour: number, minute: number, pattern: Pattern): number[] | null {
  const [ny, nm, nd] = normaliseLateYmd(year, month, day, hour)
  const s = computeSeedYmdh(seed, 0x20000, 0x2000, 0x100, 0x10000, ny, nm, nd, hour)
  return queryStarsInternal(s, minute, pattern)
}

// ── 하루 예보 ────────────────────────────────────────────────
export interface DayForecast {
  year: number
  month: number
  day: number
  weekday: number
  pattern: Pattern
  patternName: string
  weather: Weather[] // [24] clock hour 0..23
  windPower: number[] // [24]
  constellation: Constellation
  specialDay: SpecialDay
  snowLevel: SnowLevel
  spWeatherLevel: SpWeatherLevel
  fogLevel: FogLevel
  heavyFog: boolean
  waterFog: boolean
  rainbowCount: number
  rainbowHour: number
  aurora: boolean
  lightShower: boolean
  heavyShower: boolean
  shootingStars: StarInfo[]
}

const preNormalFogPatterns: PatternKind[] = [PatternKind.Fine, PatternKind.FineCloud, PatternKind.CloudFine, PatternKind.FineRain, PatternKind.EventDay]
const preWaterFogPatterns: PatternKind[] = [PatternKind.Fine, PatternKind.FineCloud, PatternKind.CloudFine, PatternKind.FineRain]
const fogPatterns: PatternKind[] = [PatternKind.Cloud, PatternKind.Rain, PatternKind.FineCloud, PatternKind.CloudFine, PatternKind.CloudRain, PatternKind.RainCloud]

export function getDayForecast(
  hemi: Hemisphere,
  seed: number,
  year: number,
  month: number,
  day: number,
  withStars = true,
): DayForecast {
  // 전날(안개 판정용)
  let prevDay = day - 1, prevMonth = month, prevYear = year
  if (prevDay === 0) {
    prevMonth -= 1
    if (prevMonth === 0) {
      prevMonth = 12
      prevYear -= 1
    }
    prevDay = getMonthLength(prevYear, prevMonth)
  }

  const pattern = getPattern(hemi, seed, year, month, day)
  const constellation = getConstellation(month, day)
  const specialDay = isSpecialDay(hemi, year, month, day)
  const snowLevel = getSnowLevel(hemi, month, day)
  const spWeatherLevel = getSpWeatherLevel(hemi, month, day)
  const fogLevel = getFogLevel(hemi, month, day)
  const aurora = isAuroraPattern(hemi, month, day, pattern)
  const lightShower = isLightShowerPattern(pattern)
  const heavyShower = isHeavyShowerPattern(pattern)
  const rb = getRainbowInfo(hemi, seed, year, month, day, pattern)

  const weather: Weather[] = []
  const windPower: number[] = []
  for (let hour = 0; hour < 24; hour++) {
    weather.push(getWeather(hour, pattern))
    windPower.push(getWindPower(seed, year, month, day, hour, pattern))
  }

  let heavyFog = false
  let waterFog = false
  const prevKind = patternKind(getPattern(hemi, seed, prevYear, prevMonth, prevDay))
  const thisKind = patternKind(pattern)
  if (preNormalFogPatterns.includes(prevKind) && fogPatterns.includes(thisKind)) {
    heavyFog =
      windPower[5] < 3 && windPower[6] < 3 && windPower[7] < 3 && windPower[8] < 3 && fogLevel === FogLevel.HeavyAndWater
  }
  if (preWaterFogPatterns.includes(prevKind) && fogPatterns.includes(thisKind)) {
    waterFog = fogLevel !== FogLevel.None && checkWaterFog(seed, year, month, day)
  }

  const shootingStars: StarInfo[] = []
  if (withStars) {
    for (let lh = 0; lh < 9; lh++) {
      const hour = fromLinearHour(lh)
      if (canHaveShootingStars(hour, pattern)) {
        for (let minute = 0; minute < 60; minute++) {
          const seconds = dayStars(seed, year, month, day, hour, minute, pattern)
          if (seconds && seconds.length > 0) shootingStars.push({ hour, minute, seconds })
        }
      }
    }
  }

  return {
    year,
    month,
    day,
    weekday: new Date(year, month - 1, day).getDay(),
    pattern,
    patternName: PATTERN_NAMES[pattern],
    weather,
    windPower,
    constellation,
    specialDay,
    snowLevel,
    spWeatherLevel,
    fogLevel,
    heavyFog,
    waterFog,
    rainbowCount: Math.min(rb.count, 2),
    rainbowHour: rb.hour,
    aurora,
    lightShower,
    heavyShower,
    shootingStars,
  }
}

// 아우로라가 해당 시각에 보이는지 (일별 화면 시간별 마커용)
export function hasAuroraAtHour(day: DayForecast, hour: number): boolean {
  if (day.aurora && day.weather[hour] === Weather.Clear) {
    return hour <= 3 || hour >= 18
  }
  return false
}

// ── 집계 (연간/월간 카운트용 경량 계산: 별·바람 생략) ─────────
interface DayFlags {
  aurora: boolean
  rainbowCount: number
  lightShower: boolean
  heavyShower: boolean
}
function getDayFlags(hemi: Hemisphere, seed: number, year: number, month: number, day: number): DayFlags {
  const pattern = getPattern(hemi, seed, year, month, day)
  const rb = getRainbowInfo(hemi, seed, year, month, day, pattern)
  return {
    aurora: isAuroraPattern(hemi, month, day, pattern),
    rainbowCount: Math.min(rb.count, 2),
    lightShower: isLightShowerPattern(pattern),
    heavyShower: isHeavyShowerPattern(pattern),
  }
}

export interface MonthAggregate {
  year: number
  month: number
  auroraCount: number
  rainbowCount: number
  singleRainbowCount: number
  doubleRainbowCount: number
  lightShowerCount: number
  heavyShowerCount: number
}

export function getMonthAggregate(hemi: Hemisphere, seed: number, year: number, month: number): MonthAggregate {
  const agg: MonthAggregate = {
    year,
    month,
    auroraCount: 0,
    rainbowCount: 0,
    singleRainbowCount: 0,
    doubleRainbowCount: 0,
    lightShowerCount: 0,
    heavyShowerCount: 0,
  }
  const dayCount = getMonthLength(year, month)
  for (let d = 1; d <= dayCount; d++) {
    const f = getDayFlags(hemi, seed, year, month, d)
    if (f.aurora) agg.auroraCount += 1
    if (f.rainbowCount > 0) agg.rainbowCount += 1
    if (f.rainbowCount === 1) agg.singleRainbowCount += 1
    if (f.rainbowCount === 2) agg.doubleRainbowCount += 1
    if (f.lightShower) agg.lightShowerCount += 1
    if (f.heavyShower) agg.heavyShowerCount += 1
  }
  return agg
}

// 연간: 12개월 집계
export function getYearAggregate(hemi: Hemisphere, seed: number, year: number): MonthAggregate[] {
  const out: MonthAggregate[] = []
  for (let m = 1; m <= 12; m++) out.push(getMonthAggregate(hemi, seed, year, m))
  return out
}

// 월간: 일별 예보(시간 막대용). 별똥별 분단위 계산은 생략(withStars=false) — 일별 화면에서만 전체 계산.
export function getMonthForecast(hemi: Hemisphere, seed: number, year: number, month: number): DayForecast[] {
  const dayCount = getMonthLength(year, month)
  const days: DayForecast[] = []
  for (let d = 1; d <= dayCount; d++) days.push(getDayForecast(hemi, seed, year, month, d, false))
  return days
}

// 'north' | 'south' → Hemisphere
export function toHemisphere(h: 'north' | 'south'): Hemisphere {
  return h === 'south' ? Hemisphere.Southern : Hemisphere.Northern
}
