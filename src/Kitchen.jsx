import { useState, useEffect } from 'react'

export default function Kitchen() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    const fetch0rders = async () => {
      try {
        const res = await fetch('https://nordic-core.onrender.com/api/orders')
        setOrders(await res.json())
      } catch (e) { console.error(e) }
    }
    fetch0rders()
    const interval = setInterval(fetch0rders, 2000)
    return () => clearInterval(interval)
  }, [])

  const markDone = async (index) => {
    await fetch(`https://nordic-core.onrender.com/api/orders/${index}`, { method: 'DELETE' })
    setOrders(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f0f0f0', padding: '32px', fontFamily: 'Helvetica Neue' }}>
      <div style={{ fontSize: '11px', letterSpacing: '4px', color: '#555', marginBottom: '8px' }}>NORDIC CORE</div>
      <h1 style={{ letterSpacing: '4px', fontSize: '14px', color: '#4ecdc4', marginBottom: '32px' }}>
        🍽️ KÖK {orders.length > 0 && <span style={{ background: '#4ecdc4', color: '#0a0a0f', borderRadius: '10px', padding: '2px 8px', fontSize: '11px', marginLeft: '8px' }}>{orders.length}</span>}
      </h1>
      {orders.length === 0 ? (
        <p style={{ color: '#333' }}>Inga beställningar ännu...</p>
      ) : (
        orders.map((order, i) => (
          <div key={i} style={{ background: '#141420', border: '1px solid #4ecdc4', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ color: '#4ecdc4', fontSize: '12px', letterSpacing: '2px', marginBottom: '12px' }}>
              BORD {order.table} · {order.time}
            </div>
            {order.items.map((item, j) => (
              <div key={j} style={{ fontSize: '18px', marginTop: '8px', fontWeight: '600' }}>• {item}</div>
            ))}
            <button onClick={() => markDone(i)} style={{ marginTop: '14px', width: '100%', padding: '8px', background: 'transparent', border: '1px solid #4ecdc4', borderRadius: '8px', color: '#4ecdc4', fontSize: '12px', letterSpacing: '2px', cursor: 'pointer', fontWeight: '600' }}>
              ✓ KLAR
            </button>
          </div>
        ))
      )}
    </div>
  )
}
