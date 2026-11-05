// Settings page inside the Zepp app (phone): choose up to 6 coins for the Prices page
const DEFAULT = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE']
const SUGGEST = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'TRX', 'TON', 'AVAX', 'LINK', 'DOT', 'LTC', 'SUI', 'PEPE', 'SHIB']

const chip = (on) => ({
  fontSize: '14px', borderRadius: '16px', margin: '4px', padding: '4px 12px',
  background: on ? '#3D8BFD' : '#E5E9F0', color: on ? '#FFFFFF' : '#1F2937'
})

AppSettingsPage({
  state: { list: [], props: null },

  load(props) {
    this.state.props = props
    try {
      const l = JSON.parse(props.settingsStorage.getItem('watchlist') || 'null')
      this.state.list = Array.isArray(l) && l.length ? l : DEFAULT.slice()
    } catch (e) {
      this.state.list = DEFAULT.slice()
    }
  },
  save() {
    this.state.props.settingsStorage.setItem('watchlist', JSON.stringify(this.state.list))
  },
  toggle(s) {
    const l = this.state.list
    const i = l.indexOf(s)
    if (i >= 0) { if (l.length > 1) l.splice(i, 1) } else if (l.length < 6) l.push(s)
    this.save()
  },

  build(props) {
    this.load(props)
    return View({ style: { padding: '14px 16px' } }, [
      Text({ style: { fontSize: '20px', fontWeight: 'bold', color: '#111827' } }, 'Watchlist (max 6)'),
      Text({ style: { fontSize: '13px', color: '#6B7280', margin: '4px 0 10px' } }, 'Selected: ' + this.state.list.join(', ')),
      View({ style: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap' } },
        SUGGEST.map((s) => Button({ label: s, style: chip(this.state.list.indexOf(s) >= 0), onClick: () => this.toggle(s) }))),
      TextInput({
        label: 'Add another symbol (e.g. ARB)',
        placeholder: 'SYMBOL',
        subStyle: { fontSize: '15px', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '6px' },
        onChange: (v) => {
          const s = String(v || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
          if (s && this.state.list.indexOf(s) < 0) this.toggle(s)
        }
      }),
      Text({ style: { fontSize: '12px', color: '#9CA3AF', marginTop: '14px' } },
        'Data: CoinGecko, CryptoCompare, alternative.me. Not financial advice.')
    ])
  }
})
