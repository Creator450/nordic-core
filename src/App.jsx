import { useState, useRef, useEffect } from 'react'

const MENU = [
  { id: 1, category: "Starters", name: "Arctic Shrimp Cocktail", swedishName: "Arktisk räkcocktail", price: 145 },
  { id: 2, category: "Starters", name: "Reindeer Carpaccio", swedishName: "Renkalv carpaccio", price: 165 },
  { id: 3, category: "Mains", name: "Grilled Arctic Char", swedishName: "Grillad arktisk röding", price: 285 },
  { id: 4, category: "Mains", name: "Reindeer Tenderloin", swedishName: "Renfilé", price: 325 },
  { id: 5, category: "Mains", name: "Vegetarian Nordic Plate", swedishName: "Vegetarisk nordisk tallrik", price: 225 },
  { id: 6, category: "Desserts", name: "Cloudberry Parfait", swedishName: "Hjortronparfait", price: 115 },
  { id: 7, category: "Drinks", name: "Local Craft Beer", swedishName: "Lokalt hantverksöl", price: 95 },
  { id: 8, category: "Drinks", name: "Lingonberry Juice", swedishName: "Lingondricka", price: 65 },
]

const TABLE_NUMBER = 7

export default function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Welcome to Ice Hotel! I'm your assistant for Table ${TABLE_NUMBER}. What can I get for you today?\n\nVälkommen till Ice Hotel! Jag är din assistent för Bord ${TABLE_NUMBER}. Vad får det lov att vara?` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState([])
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const response = await fetch('https://nordic-core.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }].map(m => ({ role: m.role, content: m.content }))
        })
      })

      const data = await response.json()
      const toolUse = data.content.find(b => b.type === 'tool_use' && b.name === 'place_order')
      const textBlock = data.content.find(b => b.type === 'text')
      const assistantMessage = textBlock ? textBlock.text : ''

      if (toolUse) {
        const itemNames = toolUse.input.items
        const orderedItems = itemNames.map(name => MENU.find(m => m.name.toLowerCase() === name.toLowerCase())).filter(Boolean)
        setOrder(prev => [...prev, ...orderedItems])
        const swedishItems = itemNames.map(name => {
          const menuItem = MENU.find(m => m.name.toLowerCase() === name.toLowerCase())
          return menuItem ? menuItem.swedishName : name
        })
        await fetch('https://nordic-core.onrender.com/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table: TABLE_NUMBER, items: swedishItems })
        })
        setMessages(prev => [...prev, { role: 'assistant', content: (assistantMessage || 'Perfect!') + '\n\n✅ Din beställning har skickats!' }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }])
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f0f0f0', fontFamily: "'Helvetica Neue', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '600px', padding: '24px 20px 16px', borderBottom: '1px solid #1a1a2e' }}>
        <div style={{ fontSize: '11px', letterSpacing: '4px', color: '#888', marginBottom: '4px' }}>ICE HOTEL · KIRUNA</div>
        <div style={{ fontSize: '22px', fontWeight: '300', letterSpacing: '2px' }}>Table {TABLE_NUMBER}</div>
        {order.length > 0 && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#4ecdc4' }}>
            {order.length} item{order.length > 1 ? 's' : ''} ordered · {order.reduce((sum, i) => sum + i.price, 0)} SEK
          </div>
        )}
      </div>
      <div style={{ flex: 1, width: '100%', maxWidth: '600px', padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '80%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: msg.role === 'user' ? '#2a2a4a' : '#141420', border: msg.role === 'user' ? '1px solid #3a3a6a' : '1px solid #1e1e30', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: '#141420', border: '1px solid #1e1e30', color: '#888', fontSize: '14px' }}>typing...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ width: '100%', maxWidth: '600px', padding: '16px 20px 32px', borderTop: '1px solid #1a1a2e' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Ask about the menu or place your order..." style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', background: '#141420', border: '1px solid #2a2a4a', color: '#f0f0f0', fontSize: '14px', outline: 'none' }} />
          <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ padding: '12px 20px', borderRadius: '24px', background: loading || !input.trim() ? '#1a1a2e' : '#4ecdc4', border: 'none', color: loading || !input.trim() ? '#444' : '#0a0a0f', fontSize: '14px', fontWeight: '600', cursor: 'pointer', letterSpacing: '1px' }}>
            SEND
          </button>
        </div>
      </div>
    </div>
  )
}