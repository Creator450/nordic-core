const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const app = express()
app.use(cors())
app.use(express.json())

const DB_FILE = path.join(__dirname, 'db.json')

const readDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ kitchenOrders: [], barOrders: [] }))
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
}

const writeDB = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data))
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'You are a friendly waiter at Ice Hotel in Kiruna, Sweden. Help guests order food and drinks. When a guest confirms their order, respond with ORDER_CONFIRMED:[item1,item2] using exact menu item names.',
        messages: messages
      })
    })
    const data = await response.json()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/orders', (req, res) => {
  const { table, items } = req.body
  const time = new Date().toLocaleTimeString()
  const db = readDB()
  const MENU_ITEMS = [
    'Arctic Shrimp Cocktail', 'Reindeer Carpaccio', 'Grilled Arctic Char',
    'Reindeer Tenderloin', 'Vegetarian Nordic Plate', 'Cloudberry Parfait',
    'Local Craft Beer', 'Lingonberry Juice',
    'Arktisk räkcocktail', 'Renkalv carpaccio', 'Grillad arktisk röding',
    'Renfilé', 'Vegetarisk nordisk tallrik', 'Hjortronparfait',
    'Lokalt hantverksöl', 'Lingondricka'
  ]
  const cleanItems = items.filter(item => 
    MENU_ITEMS.some(m => item.toLowerCase().includes(m.toLowerCase()) || m.toLowerCase().includes(item.toLowerCase()))
  )
  const finalItems = cleanItems.length > 0 ? cleanItems : items.slice(0, 3).filter(i => i.length < 50)
  const drinkKeywords = ['beer','juice','drink','water','wine','cocktail','cider','soda','coffee','tea','öl','dricka','kaffe','te']
  const foodItems = finalItems.filter(item => !drinkKeywords.some(d => item.toLowerCase().includes(d)))
  const drinkItems = finalItems.filter(item => drinkKeywords.some(d => item.toLowerCase().includes(d)))
  if (foodItems.length > 0) db.kitchenOrders.push({ table, items: foodItems, time })
  if (drinkItems.length > 0) db.barOrders.push({ table, items: drinkItems, time })
  writeDB(db)
  res.json({ success: true })
})

app.get('/api/orders', (req, res) => res.json(readDB().kitchenOrders))
app.get('/api/bar-orders', (req, res) => res.json(readDB().barOrders))

app.delete('/api/orders/:index', (req, res) => {
  const db = readDB()
  db.kitchenOrders.splice(parseInt(req.params.index), 1)
  writeDB(db)
  res.json({ success: true })
})

app.delete('/api/bar-orders/:index', (req, res) => {
  const db = readDB()
  db.barOrders.splice(parseInt(req.params.index), 1)
  writeDB(db)
  res.json({ success: true })
})

app.listen(process.env.PORT || 3001, () => console.log('Server running'))
