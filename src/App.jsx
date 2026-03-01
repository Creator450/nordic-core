import { useState, useRef, useEffect } from 'react'

const MENU = [
  { id: 1, category: "Starters", name: "Arctic Shrimp Cocktail", price: 145, description: "Fresh arctic shrimps with our signature sauce" },
  { id: 2, category: "Starters", name: "Reindeer Carpaccio", price: 165, description: "Thinly sliced reindeer with lingonberry dressing" },
  { id: 3, category: "Mains", name: "Grilled Arctic Char", price: 285, description: "Fresh char from local waters with seasonal vegetables" },
  { id: 4, category: "Mains", name: "Reindeer Tenderloin", price: 325, description: "Premium reindeer with root vegetables and cloudberry sauce" },
  { id: 5, category: "Mains", name: "Vegetarian Nordic Plate", price: 225, description: "Seasonal vegetables, mushrooms and Nordic grains" },
  { id: 6, category: "Desserts", name: "Cloudberry Parfait", price: 115, description: "Wild cloudberries with vanilla cream" },
  { id: 7, category: "Drinks", name: "Local Craft Beer", price: 95, description: "Brewed in Kiruna" },
  { id: 8, category: "Drinks", name: "Lingonberry Juice", price: 65, description: "Fresh pressed, non-alcoholic" },
]

const TABLE_NUMBER = 7

export default function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Welcome to Ice Hotel! 🏔️ I'm your assistant for Table ${TABLE_NUMBER}. What can I get for you today?\n\nVälkommen till Ice Hotel! 🏔️ Jag är din assistent för Bord ${TABLE_NUMBER}. Vad får det lov att vara?` }
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
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are a friendly, professional waiter at Ice Hotel in Kiruna, Sweden.

LANGUAGE: Always respond in the same language the customer writes in.

YOUR WAITER FLOW - follow this order strictly:
1. Take their main course order
2. If they order Reindeer Tenderloin or Grilled Arctic Char, ask how they want it cooked (rare/medium rare/medium/well done)
3. Ask if they would like a starter (förrätt) - suggest Arctic Shrimp Cocktail or Reindeer Carpaccio
4. Ask if they would like something to drink
5. Once you have everything, show the complete order with each item and total price
6. Ask "Är det bra så?" (or equivalent in their language)
7. Only when customer confirms, end your message with: ORDER_CONFIRMED: [all items separated by commas]

IMPORTANT RULES:
- Keep responses short and natural like a real waiter - max 2-3 sentences
- Never send ORDER_CONFIRMED more than once
- Never ask for confirmation twice
- Only send ORDER_CONFIRMED after customer says yes/ja/correct to the final summary

Menu:
${MENU.map(item => `- ${item.name}: ${item.price} SEK - ${item.description}`).join('\n')}

Current order Table ${TABLE_NUMBER}: ${order.length > 0 ? order.map(i => i.name).join(', ') : 'Nothing yet'}`,
          messages: [...messages, { role: 'user', content: userMessage }].map(m => ({ role: m.role, content: m.content }))
        })
      })

      const data = await response.json()
      const assistantMessage = data.content[0].text

      if (assistantMessage.includes('ORDER_CONFIRMED:')) {
        const orderPart = assistantMessage.split('ORDER_CONFIRMED:')[1].trim()
        const items = orderPart.split(',').map(s => s.trim())
        const orderedItems = items.map(name => MENU.find(m => m.name.toLowerCase().includes(name.toLowerCase()))).filter(Boolean)
        setOrder(prev => [...prev, ...orderedItems])

        await fetch('http://localhost:3001/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table: TABLE_NUMBER, items: items })
        })

        setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage.replace(`ORDER_CONFIRMED: ${orderPart}`, '').trim() + '\n\n✅ Your order has been sent to the kitchen!' }])
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