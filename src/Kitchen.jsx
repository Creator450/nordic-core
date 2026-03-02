import { useState, useEffect } from 'react'

export default function Kitchen() {
  const [kitchenOrders, setKitchenOrders] = useState([])
  const [barOrders, setBarOrders] = useState([])

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const [kitchenRes, barRes] = await Promise.all([
          fetch('https://nordic-core-production.up.railway.app/api/orders'),
          fetch('https://nordic-core-production.up.railway.app/api/bar-orders')
        ])
        const kitchen = await kitchenRes.json()
        const bar = await barRes.json()
        setKitchenOrders(kitchen)
        setBarOrders(bar)
      } catch (e) {
        console.error('Failed to fetch orders:', e)
      }
    }

    fetchOrders()
    const interval = setInterval(fetchOrders, 2000)
    return () => clearInterval(interval)
  }, [])

  const markKitchenDone = async (index) => {
    await fetch(`https://nordic-core-production.up.railway.app/api/orders/${index}`, { method: 'DELETE' })
    setKitchenOrders(prev => prev.filter((_, i) => i !== index))
  }

  const markBarDone = async (index) => {
    await fetch(`https://nordic-core-production.up.railway.app/api/bar-orders/${index}`, { method: 'DELETE' })
    setBarOrders(prev => prev.filter((_, i) => i !== index))
  }

  const cardStyle = (color) => ({
    background: '#141420',
    border: `1px solid ${color}`,
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px'
  })

  const doneButtonStyle = (color) => ({
    marginTop: '14px',
    width: '100%',
    padding: '8px',
    background: 'transparent',
    border: `1px solid ${color}`,
    borderRadius: '8px',
    color: color,
    fontSize: '12px',
    letterSpacing: '2px',
    cursor: 'pointer',
    fontWeight: '600'
  })

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f0f0f0', padding: '32px', fontFamily: 'Helvetica Neue' }}>
      <div style={{ fontSize: '11px', letterSpacing: '4px', color: '#555', marginBottom: '32px' }}>
        NORDIC CORE · KITCHEN DISPLAY · {new Date().toLocaleTimeString()}
      </div>
      <div style={{ display: 'flex', gap: '32px' }}>

        <div style={{ flex: 1 }}>
          <h2 style={{ letterSpacing: '4px', fontSize: '14px', color: '#4ecdc4', marginBottom: '24px' }}>
            🍽️ KITCHEN {kitchenOrders.length > 0 && <span style={{ background: '#4ecdc4', color: '#0a0a0f', borderRadius: '10px', padding: '2px 8px', fontSize: '11px', marginLeft: '8px' }}>{kitchenOrders.length}</span>}
          </h2>
          {kitchenOrders.length === 0 ? (
            <p style={{ color: '#333' }}>No orders yet...</p>
          ) : (
            kitchenOrders.map((order, i) => (
              <div key={i} style={cardStyle('#4ecdc4')}>
                <div style={{ color: '#4ecdc4', fontSize: '12px', letterSpacing: '2px', marginBottom: '12px' }}>
                  TABLE {order.table} · {order.time}
                </div>
                {order.items.map((item, j) => (
                  <div key={j} style={{ fontSize: '16px', marginTop: '8px' }}>🍽️ {item}</div>
                ))}
                <button onClick={() => markKitchenDone(i)} style={doneButtonStyle('#4ecdc4')}>
                  ✓ DONE
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ flex: 1 }}>
          <h2 style={{ letterSpacing: '4px', fontSize: '14px', color: '#f7c948', marginBottom: '24px' }}>
            🍺 BAR {barOrders.length > 0 && <span style={{ background: '#f7c948', color: '#0a0a0f', borderRadius: '10px', padding: '2px 8px', fontSize: '11px', marginLeft: '8px' }}>{barOrders.length}</span>}
          </h2>
          {barOrders.length === 0 ? (
            <p style={{ color: '#333' }}>No orders yet...</p>
          ) : (
            barOrders.map((order, i) => (
              <div key={i} style={cardStyle('#f7c948')}>
                <div style={{ color: '#f7c948', fontSize: '12px', letterSpacing: '2px', marginBottom: '12px' }}>
                  TABLE {order.table} · {order.time}
                </div>
                {order.items.map((item, j) => (
                  <div key={j} style={{ fontSize: '16px', marginTop: '8px' }}>🍺 {item}</div>
                ))}
                <button onClick={() => markBarDone(i)} style={doneButtonStyle('#f7c948')}>
                  ✓ DONE
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}