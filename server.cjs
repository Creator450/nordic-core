const express = require('express')
const cors = require('cors')
const app = express()
app.use(cors())
app.use(express.json())

let kitchenOrders = []
let barOrders = []

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, tableNumber } = req.body
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
        system: 'You are a friendly waiter at Ice Hotel in Kiruna, Sweden. Help guests order food and drinks. When a guest confirms their order, respond with ORDER_CONFIRMED: followed by items separated by commas.',
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
  const drinkKeywords = ['beer','juice','drink','water','wine','cocktail','cider','soda','coffee','tea']
  const foodItems = items.filter(item => !drinkKeywords.some(d => item.toLowerCase().includes(d)))
  const drinkItems = items.filter(item => drinkKeywords.some(d => item.toLowerCase().includes(d)))
  if (foodItems.length > 0) kitchenOrders.push({ table, items: foodItems, time })
  if (drinkItems.length > 0) barOrders.push({ table, items: drinkItems, time })
  res.json({ success: true })
})

app.get('/api/orders', (req, res) => res.json(kitchenOrders))
app.get('/api/bar-orders', (req, res) => res.json(barOrders))

app.delete('/api/orders/:index', (req, res) => {
  kitchenOrders.splice(parseInt(req.params.index), 1)
  res.json({ success: true })
})

app.delete('/api/bar-orders/:index', (req, res) => {
  barOrders.splice(parseInt(req.params.index), 1)
  res.json({ success: true })
})

app.listen(process.env.PORT || 3001, () => console.log('Server running'))
