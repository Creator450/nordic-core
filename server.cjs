
const express = require('express')
const cors = require('cors')
const app = express()
app.use(cors())
app.use(express.json())

let kitchenOrders = []
let barOrders = []

app.post('/api/chat', async (req, res) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
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

  const drinkKeywords = ['beer', 'juice', 'drink', 'water', 'wine', 'cocktail', 'cider', 'craft', 'lingonberry', 'soda', 'coffee', 'tea']

  const foodItems = items.filter(item => !drinkKeywords.some(d => item.toLowerCase().includes(d)))
  const drinkItems = items.filter(item => drinkKeywords.some(d => item.toLowerCase().includes(d)))

  if (foodItems.length > 0) {
    kitchenOrders.push({ table, items: foodItems, time })
  }
  if (drinkItems.length > 0) {
    barOrders.push({ table, items: drinkItems, time })
  }

  res.json({ success: true })
})

app.get('/api/orders', (req, res) => {
  res.json(kitchenOrders)
})

app.get('/api/bar-orders', (req, res) => {
  res.json(barOrders)
})

app.delete('/api/orders/:index', (req, res) => {
  const index = parseInt(req.params.index)
  if (index >= 0 && index < kitchenOrders.length) {
    kitchenOrders.splice(index, 1)
    res.json({ success: true })
  } else {
    res.status(400).json({ error: 'Invalid index' })
  }
})

app.delete('/api/bar-orders/:index', (req, res) => {
  const index = parseInt(req.params.index)
  if (index >= 0 && index < barOrders.length) {
    barOrders.splice(index, 1)
    res.json({ success: true })
  } else {
    res.status(400).json({ error: 'Invalid index' })
  }
})

app.listen(3001, () => console.log('Server running on port 3001'))