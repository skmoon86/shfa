import type { PriceEntry } from './nookipedia'

const currencyKo: Record<string, string> = {
  Bells: '벨',
  'Nook Miles': '마일',
  Poki: '포키',
}

export function fmtBells(n?: number): string {
  if (n === undefined || n === null || n < 0) return '-'
  return n.toLocaleString('ko-KR')
}

export function fmtPrice(entry?: PriceEntry): string {
  if (!entry) return '-'
  const cur = currencyKo[entry.currency] ?? entry.currency
  return `${entry.price.toLocaleString('ko-KR')} ${cur}`
}

export function fmtBuy(buy?: PriceEntry[]): string {
  if (!buy || buy.length === 0) return '판매 안 함'
  return buy.map(fmtPrice).join(' / ')
}

// 구매 통화별 실제 구매처(상세 획득 방법용). 매핑 없으면 통화명으로 폴백.
const buyLocationKo: Record<string, string> = {
  Bells: '너굴 상점에서 구매',
  'Nook Miles': '너굴 포트에서 마일로 교환',
  Poki: '파라다이스 플래닝에서 포키로 구매',
}
export function buyDetail(buy?: PriceEntry[]): { label: string; price: string }[] {
  if (!buy) return []
  return buy
    .filter((b) => b.price > 0)
    .map((b) => ({
      label: buyLocationKo[b.currency] ?? `${currencyKo[b.currency] ?? b.currency} 구매`,
      price: fmtPrice(b),
    }))
}
