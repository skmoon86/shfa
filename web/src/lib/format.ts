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
