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
        system: `You are a friendly waiter at Ice Hotel in Kiruna, Sweden. 
Respond in the same language the customer uses.
Keep responses to maximum 2 sentences.
Menu:
- Arctic Shrimp Cocktail: 145 SEK
- Reindeer Carpaccio: 165 SEK
- Grilled Arctic Char: 285 SEK
- Reindeer Tenderloin: 325 SEK
- Vegetarian Nordic Plate: 225 SEK
- Cloudberry Parfait: 115 SEK
- Local Craft Beer: 95 SEK
- Lingonberry Juice: 65 SEK

Take the order step by step. When customer confirms, use the place_order tool with ONLY the exact menu item names listed above.`,
        tools: [{
          name: 'place_order',
          description: 'Place confirmed order to kitchen and bar. Use exact menu item names only.',
          input_schema: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { type: 'string' },
                description: 'Exact menu item names e.g. ["Reindeer Tenderloin", "Local Craft Beer"]'
              }
            },
            required: ['items']
          }
        }],
        tool_choice: { type: 'auto' },
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
  const drinkNames = ['Local Craft Beer', 'Lingonberry Juice', 'Lokalt hantverksöl', 'Lingondricka']
  const foodItems = items.filter(item => !drinkNames.some(d => d.toLowerCase() === item.toLowerCase()))
  const drinkItems = items.filter(item => drinkNames.some(d => d.toLowerCase() === item.toLowerCase()))
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
