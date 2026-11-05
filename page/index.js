// Crypto Market — one page, four screens. Swipe left/right or use the UP/DOWN buttons.
//   1 PRICES   2 MARKET   3 MOVERS   4 ABOUT (donation QR)
// No image assets: everything is drawn with text and shapes.
import { createWidget, deleteWidget, widget, prop, align, text_style } from '@zos/ui'
import { localStorage } from '@zos/storage'
import { onGesture, offGesture, GESTURE_LEFT, GESTURE_RIGHT, onKey, offKey, KEY_UP, KEY_DOWN, KEY_SELECT, KEY_EVENT_CLICK } from '@zos/interaction'
import { setPageBrightTime, resetPageBrightTime } from '@zos/display'
import { C, APP_VERSION, REFRESH_MS } from '../utils/config'
import { DONATE, DEVELOPER, OFFICIAL } from '../utils/credits'
import { price, compact, pct, hhmm } from '../utils/format'

const { messageBuilder } = getApp()._options.globalData
const S = 454
const PAGES = 4
const TITLES = ['PRICES', 'MARKET', 'MOVERS', 'ABOUT']

let screens = [[], [], [], []]
let cur = 0
let ui = {}
let timer = null
let busy = false
let qr = null

// ---------- small drawing helpers ----------
function add(page, w) {
  screens[page].push(w)
  return w
}
function text(page, o) {
  return add(page, createWidget(widget.TEXT, Object.assign({
    text: '', color: C.TEXT, text_size: 22, align_h: align.CENTER_H, align_v: align.CENTER_V,
    text_style: text_style.NONE
  }, o)))
}
function card(page, x, y, w, h, color) {
  add(page, createWidget(widget.FILL_RECT, { x, y, w, h, radius: 14, color: color || C.CARD }))
  add(page, createWidget(widget.STROKE_RECT, { x, y, w, h, radius: 14, line_width: 1, color: C.CARD_BORDER }))
}
function badge(page, x, y, w, h) {
  const bg = add(page, createWidget(widget.FILL_RECT, { x, y, w, h, radius: h / 2, color: C.CARD_BORDER }))
  const t = text(page, { x, y, w, h, text_size: 19, text: '--' })
  return {
    set(v) {
      const up = typeof v === 'number' && v >= 0
      const has = typeof v === 'number' && !isNaN(v)
      bg.setProperty(prop.MORE, { x, y, w, h, radius: h / 2, color: has ? (up ? C.UP_BG : C.DOWN_BG) : C.CARD_BORDER })
      t.setProperty(prop.MORE, { text: pct(v), color: has ? (up ? C.UP : C.DOWN) : C.MUTED })
    }
  }
}

Page({
  build() {
    try { setPageBrightTime({ brightTime: 60 * 1000 }) } catch (e) {}
    screens = [[], [], [], []]
    createWidget(widget.FILL_RECT, { x: 0, y: 0, w: S, h: S, color: C.BG })

    // credits / donation address were modified -> refuse to run
    if (!OFFICIAL) {
      createWidget(widget.TEXT, {
        x: 40, y: 150, w: 374, h: 150, text: 'UNOFFICIAL BUILD\n\nCredits were modified.\nPlease install the original version.',
        text_size: 24, color: C.DOWN, align_h: align.CENTER_H, align_v: align.CENTER_V, text_style: text_style.WRAP
      })
      return
    }

    // ----- shared header + page dots -----
    ui.title = createWidget(widget.TEXT, {
      x: 0, y: 26, w: S, h: 34, text: TITLES[0], text_size: 24, color: C.ACCENT,
      align_h: align.CENTER_H, align_v: align.CENTER_V
    })
    ui.dots = []
    for (let i = 0; i < PAGES; i++) {
      ui.dots.push(createWidget(widget.CIRCLE, { center_x: S / 2 - 27 + i * 18, center_y: 430, radius: 4, color: C.CARD_BORDER }))
    }

    this.buildPrices()
    this.buildMarket()
    this.buildMovers()
    this.buildAbout()

    // ----- navigation -----
    try {
      onGesture({
        callback: (e) => {
          if (e === GESTURE_LEFT) { this.go(cur + 1); return true }
          if (e === GESTURE_RIGHT && cur > 0) { this.go(cur - 1); return true }
          return false // swipe right on the first screen = exit app
        }
      })
    } catch (e) {}
    try {
      onKey({
        callback: (key, ev) => {
          if (ev !== KEY_EVENT_CLICK) return false
          if (key === KEY_DOWN) { this.go(cur + 1); return true }
          if (key === KEY_UP) { this.go(cur - 1); return true }
          if (key === KEY_SELECT) { this.refresh(); return true }
          return false
        }
      })
    } catch (e) {}

    // show cached data immediately, then refresh
    const cached = localStorage.getItem('market', null)
    if (cached) this.render(cached, true)
    this.go(0)
    this.refresh()
    timer = setInterval(() => this.refresh(), REFRESH_MS)
  },

  onDestroy() {
    if (qr) this.showQR(false)
    if (timer) clearInterval(timer)
    try { offGesture() } catch (e) {}
    try { offKey() } catch (e) {}
    try { resetPageBrightTime() } catch (e) {}
  },

  go(i) {
    cur = (i + PAGES) % PAGES
    screens.forEach((ws, p) => ws.forEach((w) => w.setProperty(prop.VISIBLE, p === cur)))
    this.showQR(cur === 3)
    ui.title.setProperty(prop.TEXT, TITLES[cur])
    ui.dots.forEach((d, k) => d.setProperty(prop.MORE, {
      center_x: S / 2 - 27 + k * 18, center_y: 430, radius: k === cur ? 5 : 4, color: k === cur ? C.ACCENT : C.CARD_BORDER
    }))
  },

  // ================= PAGE 1: PRICES =================
  buildPrices() {
    ui.rows = []
    for (let i = 0; i < 6; i++) {
      const y = 70 + i * 52
      card(0, 80, y, 294, 46)
      const sym = text(0, { x: 92, y, w: 74, h: 46, text_size: 22, color: C.TEXT, align_h: align.LEFT, text: '---' })
      const pr = text(0, { x: 160, y, w: 120, h: 46, text_size: 22, color: C.TEXT, align_h: align.RIGHT, text: '--' })
      const b = badge(0, 288, y + 9, 80, 28)
      ui.rows.push({ sym, pr, b })
    }
    ui.updated = text(0, { x: 0, y: 384, w: S, h: 24, text_size: 16, color: C.MUTED, text: 'Loading...' })
  },

  // ================= PAGE 2: MARKET =================
  buildMarket() {
    text(1, { x: 0, y: 64, w: S, h: 24, text: 'TOTAL MARKET CAP', text_size: 17, color: C.MUTED })
    ui.mcap = text(1, { x: 0, y: 88, w: S, h: 52, text: '--', text_size: 44, color: C.TEXT })
    ui.mcapCh = badge(1, 172, 142, 110, 30)

    const tile = (x, y, label) => {
      card(1, x, y, 150, 82)
      text(1, { x, y: y + 8, w: 150, h: 20, text: label, text_size: 15, color: C.MUTED })
      const v = text(1, { x, y: y + 30, w: 150, h: 32, text: '--', text_size: 26 })
      const s = text(1, { x, y: y + 58, w: 150, h: 20, text: '', text_size: 14, color: C.MUTED })
      return { v, s }
    }
    ui.vol = tile(72, 184, '24H VOLUME')
    ui.dom = tile(232, 184, 'BTC DOMINANCE')
    ui.fng = tile(72, 274, 'FEAR & GREED')
    ui.br = tile(232, 274, 'TOP 100 UP/DOWN')
    // breadth bar
    add(1, createWidget(widget.FILL_RECT, { x: 127, y: 370, w: 200, h: 8, radius: 4, color: C.DOWN }))
    ui.brBar = add(1, createWidget(widget.FILL_RECT, { x: 127, y: 370, w: 100, h: 8, radius: 4, color: C.UP }))
    ui.mUpdated = text(1, { x: 0, y: 386, w: S, h: 22, text_size: 15, color: C.MUTED })
  },

  // ================= PAGE 3: MOVERS =================
  buildMovers() {
    const row = (y, color) => {
      card(2, 70, y, 314, 50)
      add(2, createWidget(widget.FILL_RECT, { x: 70, y: y + 10, w: 4, h: 30, radius: 2, color }))
      const s = text(2, { x: 84, y, w: 90, h: 50, text_size: 22, align_h: align.LEFT, text: '---' })
      const p = text(2, { x: 164, y, w: 110, h: 50, text_size: 19, color: C.MUTED, align_h: align.LEFT, text: '--' })
      const c = text(2, { x: 270, y, w: 104, h: 50, text_size: 24, align_h: align.RIGHT, color, text: '--' })
      return { s, p, c }
    }
    text(2, { x: 0, y: 66, w: S, h: 22, text: 'TOP GAINERS 24H', text_size: 17, color: C.UP })
    ui.g = [row(92, C.UP), row(148, C.UP)]
    text(2, { x: 0, y: 208, w: S, h: 22, text: 'TOP LOSERS 24H', text_size: 17, color: C.DOWN })
    ui.l = [row(234, C.DOWN), row(290, C.DOWN)]
    text(2, { x: 0, y: 350, w: S, h: 22, text: 'Top 100 by market cap, no stablecoins', text_size: 14, color: C.MUTED })
    ui.vUpdated = text(2, { x: 0, y: 378, w: S, h: 22, text_size: 15, color: C.MUTED })
  },

  // ================= PAGE 4: ABOUT / DONATE =================
  buildAbout() {
    text(3, { x: 0, y: 62, w: S, h: 30, text: 'Developed by ' + DEVELOPER, text_size: 26, color: C.TEXT })
    text(3, { x: 0, y: 94, w: S, h: 26, text: 'Donate  USDT (TRC20)', text_size: 19, color: C.WARN })
    const a = DONATE
    text(3, { x: 40, y: 330, w: 374, h: 24, text: a.slice(0, 8) + '...' + a.slice(-8), text_size: 17, color: C.MUTED })
    text(3, { x: 0, y: 358, w: S, h: 22, text: 'v' + APP_VERSION + '  -  Not financial advice', text_size: 14, color: C.MUTED })
  },

  // The QR widget cannot be moved/hidden reliably, so it is created when the
  // About screen opens and deleted when you leave it.
  showQR(on) {
    if (on && !qr) {
      qr = createWidget(widget.QRCODE, {
        content: DONATE,
        x: 137, y: 130, w: 180, h: 180,
        bg_x: 127, bg_y: 120, bg_w: 200, bg_h: 200
      })
    } else if (!on && qr) {
      try { deleteWidget(qr) } catch (e) {}
      qr = null
    }
  },

  // ================= DATA =================
  refresh() {
    if (busy) return
    busy = true
    ui.updated.setProperty(prop.TEXT, 'Updating...')
    let done = false
    const guard = setTimeout(() => {
      if (done) return
      done = true
      busy = false
      ui.updated.setProperty(prop.MORE, { text: 'No reply from phone', color: C.WARN })
    }, 20000)

    messageBuilder
      .request({ method: 'GET_MARKET' }, { timeout: 18000 })
      .then((d) => {
        if (done) return
        done = true
        clearTimeout(guard)
        busy = false
        if (!d || d.error) {
          ui.updated.setProperty(prop.MORE, { text: (d && d.error) || 'No data', color: C.WARN })
          return
        }
        localStorage.setItem('market', d)
        this.render(d, false)
      })
      .catch(() => {
        if (done) return
        done = true
        clearTimeout(guard)
        busy = false
        ui.updated.setProperty(prop.MORE, { text: 'Connection error', color: C.WARN })
      })
  },

  render(d, cached) {
    const when = (cached ? 'Saved ' : 'Updated ') + hhmm(d.ts) + (d.src ? '  ' + d.src : '')

    // page 1
    ;(d.coins || []).slice(0, 6).forEach((c, i) => {
      const r = ui.rows[i]
      r.sym.setProperty(prop.TEXT, c.s)
      r.pr.setProperty(prop.TEXT, price(c.p))
      r.b.set(c.ch)
    })
    ui.updated.setProperty(prop.MORE, { text: when, color: C.MUTED })

    // page 2
    const g = d.global || {}
    ui.mcap.setProperty(prop.TEXT, compact(g.mcap))
    ui.mcapCh.set(g.mcapCh)
    ui.vol.v.setProperty(prop.TEXT, compact(g.vol))
    ui.vol.s.setProperty(prop.TEXT, g.approx ? 'top 100 (approx.)' : 'all coins')
    ui.dom.v.setProperty(prop.TEXT, typeof g.btcDom === 'number' && !isNaN(g.btcDom) ? g.btcDom.toFixed(1) + '%' : '--')
    ui.dom.s.setProperty(prop.TEXT, typeof g.ethDom === 'number' ? 'ETH ' + g.ethDom.toFixed(1) + '%' : '')
    if (d.fng) {
      const v = d.fng.v
      const col = v < 25 ? C.DOWN : v < 45 ? 0xf97316 : v < 56 ? C.WARN : v < 75 ? 0x84cc16 : C.UP
      ui.fng.v.setProperty(prop.MORE, { text: String(v), color: col })
      ui.fng.s.setProperty(prop.TEXT, d.fng.label || '')
    }
    if (d.breadth) {
      const up = d.breadth.up, dn = d.breadth.down, tot = Math.max(1, up + dn)
      ui.br.v.setProperty(prop.TEXT, up + ' / ' + dn)
      ui.br.s.setProperty(prop.TEXT, up >= dn ? 'mostly up' : 'mostly down')
      ui.brBar.setProperty(prop.MORE, { x: 127, y: 370, w: Math.max(8, Math.round((200 * up) / tot)), h: 8, radius: 4, color: C.UP })
    }
    ui.mUpdated.setProperty(prop.TEXT, when)

    // page 3
    const fill = (rows, list) => rows.forEach((r, i) => {
      const c = (list || [])[i]
      r.s.setProperty(prop.TEXT, c ? c.s : '---')
      r.p.setProperty(prop.TEXT, c ? price(c.p) : '--')
      r.c.setProperty(prop.TEXT, c ? pct(c.ch) : '--')
    })
    fill(ui.g, d.gainers)
    fill(ui.l, d.losers)
    ui.vUpdated.setProperty(prop.TEXT, when)

    // keep the current screen's visibility correct after updates
    this.go(cur)
  }
})
