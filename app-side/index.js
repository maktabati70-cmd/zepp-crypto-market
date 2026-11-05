// Side Service — runs inside the Zepp app on the phone (has internet access).
// Collects market data and sends one compact JSON to the watch.
import { MessageBuilder } from '../shared/message-side'
import { DEFAULT_WATCHLIST } from '../utils/config'

const messageBuilder = new MessageBuilder()

const STABLES = ['USDT', 'USDC', 'DAI', 'FDUSD', 'TUSD', 'USDE', 'USDD', 'PYUSD', 'BUSD', 'USDS', 'USD1', 'USDP', 'GUSD', 'FRAX', 'LUSD', 'USD0', 'RLUSD', 'BSC-USD', 'SUSDE', 'USDX']
const num = (v) => (v === undefined || v === null || v === '' ? NaN : Number(v))
const body = (res) => (typeof res.body === 'string' ? JSON.parse(res.body) : res.body)

function getWatchlist() {
  try {
    const raw = settings.settingsStorage.getItem('watchlist')
    const list = raw ? JSON.parse(raw) : null
    if (Array.isArray(list) && list.length) return list.slice(0, 6)
  } catch (e) {}
  return DEFAULT_WATCHLIST.slice()
}

async function get(url) {
  const res = await fetch({ url, method: 'GET', headers: { Accept: 'application/json' } })
  return body(res)
}

// ---------- top 100 by market cap ----------
async function top100CoinGecko() {
  const b = await get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&price_change_percentage=24h')
  if (!Array.isArray(b) || !b.length) throw new Error('cg markets')
  return b.map((c) => ({
    s: String(c.symbol || '').toUpperCase(),
    p: num(c.current_price),
    ch: num(c.price_change_percentage_24h),
    mc: num(c.market_cap),
    v: num(c.total_volume)
  }))
}
async function top100CryptoCompare() {
  const b = await get('https://min-api.cryptocompare.com/data/top/mktcapfull?limit=100&tsym=USD')
  if (!b || !Array.isArray(b.Data)) throw new Error('cc top')
  return b.Data.filter((x) => x.RAW && x.RAW.USD).map((x) => ({
    s: x.CoinInfo.Name.toUpperCase(),
    p: num(x.RAW.USD.PRICE),
    ch: num(x.RAW.USD.CHANGEPCT24HOUR),
    mc: num(x.RAW.USD.MKTCAP),
    v: num(x.RAW.USD.TOTALVOLUME24HTO)
  }))
}

// ---------- global market ----------
async function globalCoinGecko() {
  const b = await get('https://api.coingecko.com/api/v3/global')
  const d = b && b.data
  if (!d) throw new Error('cg global')
  return {
    mcap: num(d.total_market_cap && d.total_market_cap.usd),
    vol: num(d.total_volume && d.total_volume.usd),
    btcDom: num(d.market_cap_percentage && d.market_cap_percentage.btc),
    ethDom: num(d.market_cap_percentage && d.market_cap_percentage.eth),
    mcapCh: num(d.market_cap_change_percentage_24h_usd),
    coins: num(d.active_cryptocurrencies)
  }
}
async function fearGreed() {
  const b = await get('https://api.alternative.me/fng/?limit=1')
  const d = b && b.data && b.data[0]
  if (!d) throw new Error('fng')
  return { v: num(d.value), label: d.value_classification }
}
// prices for watchlist coins that are not in the top 100
async function pricesCryptoCompare(symbols) {
  if (!symbols.length) return {}
  const b = await get('https://min-api.cryptocompare.com/data/pricemultifull?fsyms=' + symbols.join(',') + '&tsyms=USD')
  const out = {}
  symbols.forEach((s) => {
    const r = b && b.RAW && b.RAW[s] && b.RAW[s].USD
    if (r) out[s] = { s, p: num(r.PRICE), ch: num(r.CHANGEPCT24HOUR) }
  })
  return out
}

async function getMarket(ctx) {
  const out = { ts: Date.now() }
  const errors = []

  let top = null
  try { top = await top100CoinGecko(); out.src = 'CoinGecko' } catch (e) { errors.push('cg') }
  if (!top) {
    try { top = await top100CryptoCompare(); out.src = 'CryptoCompare' } catch (e) { errors.push('cc') }
  }

  const [glob, fng] = await Promise.all([
    globalCoinGecko().catch(() => null),
    fearGreed().catch(() => null)
  ])

  // ---- page 1: watchlist ----
  const wl = getWatchlist()
  const bySym = {}
  if (top) top.forEach((c) => { if (!bySym[c.s]) bySym[c.s] = c })
  const missing = wl.filter((s) => !bySym[s])
  let extra = {}
  try { extra = await pricesCryptoCompare(missing) } catch (e) {}
  out.coins = wl.map((s) => {
    const c = bySym[s] || extra[s]
    return c ? { s, p: c.p, ch: c.ch } : { s }
  })

  // ---- page 2: market overview ----
  if (top) {
    const valid = top.filter((c) => !isNaN(c.ch))
    out.breadth = { up: valid.filter((c) => c.ch > 0).length, down: valid.filter((c) => c.ch < 0).length }
  }
  if (glob) {
    out.global = glob
  } else if (top) {
    const mc = top.reduce((a, c) => a + (c.mc || 0), 0)
    const btc = bySym.BTC ? bySym.BTC.mc : NaN
    out.global = { mcap: mc, vol: top.reduce((a, c) => a + (c.v || 0), 0), btcDom: (btc / mc) * 100, approx: true }
  }
  if (fng) out.fng = fng

  // ---- page 3: movers (top 100, stablecoins excluded) ----
  if (top) {
    const movers = top.filter((c) => !isNaN(c.ch) && STABLES.indexOf(c.s) < 0)
      .sort((a, b) => b.ch - a.ch)
    const pick = (c) => ({ s: c.s, p: c.p, ch: c.ch })
    out.gainers = movers.slice(0, 2).map(pick)
    out.losers = movers.slice(-2).reverse().map(pick)
  }

  if (!top && !glob) out.error = 'No data (' + errors.join(',') + ')'
  ctx.response({ data: out })
}

AppSideService({
  onInit() {
    messageBuilder.listen(() => {})
    messageBuilder.on('request', (ctx) => {
      const req = messageBuilder.buf2Json(ctx.request.payload)
      if (req.method === 'GET_MARKET') return getMarket(ctx)
    })
  },
  onRun() {},
  onDestroy() {}
})
