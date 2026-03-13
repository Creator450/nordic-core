import { useState, useEffect } from "react";

const API_BASE = "https://nordic-core.onrender.com";

export default function LaGunaKitchen() {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/laguna-orders`);
      const data = await res.json();
      setOrders(data);
    } catch (e) {}
  };

  const deleteOrder = async (index) => {
    await fetch(`${API_BASE}/api/orders/${index}`, { method: "DELETE" });
    fetchOrders();
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{minHeight:"100vh",background:"#0a0a0a",color:"#fff",fontFamily:"monospace",padding:"0"}}>
      <div style={{background:"#c8102e",padding:"20px 32px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:"28px",fontWeight:"900",letterSpacing:"2px"}}>🍕 LA GUNA PIZZERIA — KÖKSVY</div>
        <div style={{fontSize:"48px",fontWeight:"900"}}>{orders.length}</div>
      </div>
      <div style={{padding:"32px",display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))",gap:"20px"}}>
        {orders.length === 0 ? (
          <div style={{textAlign:"center",padding:"80px",color:"#333",fontSize:"20px"}}>
            🍕 Väntar på beställningar...
          </div>
        ) : orders.map((order, index) => (
          <div key={index} style={{background:"#111",border:"2px solid #222",borderRadius:"12px",padding:"24px"}}>
            <div style={{marginBottom:"16px",paddingBottom:"16px",borderBottom:"1px solid #222"}}>
              <div style={{fontSize:"12px",color:"#555",letterSpacing:"3px"}}>WHATSAPP</div>
              <div style={{fontSize:"14px",color:"#888"}}>{order.table}</div>
              <div style={{fontSize:"12px",color:"#444"}}>🕐 {order.time}</div>
            </div>
            <div style={{marginBottom:"20px"}}>
              {(order.items||[]).map((item,i) => (
                <div key={i} style={{padding:"8px 0",borderBottom:"1px solid #1a1a1a",fontSize:"18px",fontWeight:"700"}}>
                  ▶ {item}
                </div>
              ))}
            </div>
            <button onClick={() => deleteOrder(index)} style={{width:"100%",padding:"14px",background:"#1a3a1a",border:"2px solid #2d6a2d",borderRadius:"8px",color:"#4caf50",fontSize:"14px",fontWeight:"900",letterSpacing:"3px",cursor:"pointer"}}>
              ✓ KLAR
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
