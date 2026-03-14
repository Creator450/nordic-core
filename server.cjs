require('dotenv').config();
const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

const DB_FILE = path.join(__dirname, 'db.json')
const SESSIONS_FILE = path.join(__dirname, 'sessions.json')

const readDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ kitchenOrders: [], barOrders: [], laGunaOrders: [] }))
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
}
const writeDB = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data))
}

const readSessions = () => {
  if (!fs.existsSync(SESSIONS_FILE)) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify({}))
  }
  return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'))
}
const writeSessions = (data) => {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data))
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
  if (foodItems.length > 0) db.laGunaOrders.push({ table, items: foodItems, time })
  if (drinkItems.length > 0) db.barOrders.push({ table, items: drinkItems, time })
  writeDB(db)
  res.json({ success: true })
})

app.get('/api/orders', (req, res) => res.json(readDB().kitchenOrders))
app.get('/api/bar-orders', (req, res) => res.json(readDB().barOrders))
app.get('/api/laguna-orders', (req, res) => res.json(readDB().laGunaOrders))

app.delete('/api/orders/:index', (req, res) => {
  const db = readDB()
  db.kitchenOrders.splice(parseInt(req.params.index), 1)
  writeDB(db)
  res.json({ success: true })
})

app.delete("/api/laguna-orders/:index", (req, res) => {
  const db = readDB()
  db.laGunaOrders.splice(parseInt(req.params.index), 1)
  writeDB(db)
  res.json({ success: true })
})
app.delete("/api/bar-orders/:index", (req, res) => {
  const db = readDB()
  db.barOrders.splice(parseInt(req.params.index), 1)
  writeDB(db)
  res.json({ success: true })
})

// ====================================
// PIZZERIA - WHATSAPP ORDERING
// ====================================

app.post('/api/whatsapp', async (req, res) => {
  try {
    const incomingMsg = req.body.Body
    const from = req.body.From

    // Load conversation history for this customer
    const sessions = readSessions()
    if (!sessions[from]) sessions[from] = []
    sessions[from].push({ role: 'user', content: incomingMsg })

    // Keep only last 10 messages to avoid token limits
    if (sessions[from].length > 10) {
      sessions[from] = sessions[from].slice(-10)
    }

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
        system: `Du är en vänlig beställningsassistent för La Guna Pizzeria i Kiruna.
Svara på samma språk som kunden skriver på.
Max 3 meningar per svar.
Meny:
KLASSISKA PIZZOR: Margherita-95kr, Vesuvio-105kr, Capricciosa-105kr, Hawaii-105kr, Bolognese-105kr, Cacciatore-105kr, Vegetariana-105kr
LYXPIZZOR: Kebab special-135kr, Suovas pizza-135kr, Norrbotten-135kr
MEXIKANSKA: Mexikana-115kr, Azteka-115kr, Acapulco-125kr
INBAKADE: Calzone-105kr, Calzone Panza-115kr, Calzone special-125kr
RULLAR: Kebabrulle-95kr, Oxfilérulle-95kr, Kycklingrulle-95kr
Ta beställningen steg för steg. När kunden bekräftar sin beställning, använd place_order verktyget OMEDELBART.`,
        tools: [{
          name: 'place_order',
          description: 'Skicka bekräftad beställning till köket',
          input_schema: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { type: 'string' },
                description: 'Lista med beställda pizzor/rätter'
              }
            },
            required: ['items']
          }
        }],
        tool_choice: { type: 'auto' },
        messages: sessions[from]
      })
    })

    const data = await response.json()
    console.log("API response:", JSON.stringify(data));
    const content = data.content || []
    const textBlock = content.find(b => b.type === 'text')
    const toolUse = content.find(b => b.type === 'tool_use')
    
    let replyText = textBlock ? textBlock.text : 'Tack för din beställning!'

    if (toolUse) {
      const items = toolUse.input.items
      const db = readDB()
      db.laGunaOrders.push({ 
        table: `WhatsApp: ${from}`, 
        items: items, 
        time: new Date().toLocaleTimeString() 
      })
      writeDB(db)
      replyText += '\n\n✅ Din beställning är skickad till köket!'
      // Clear session after order placed
      sessions[from] = []
    } else {
      // Save assistant response to session
      sessions[from].push({ role: 'assistant', content: replyText })
    }

    writeSessions(sessions)

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Message>${replyText}</Message></Response>`
    
    res.set('Content-Type', 'text/xml')
    res.send(twiml)

  } catch (error) {
    console.log('Error:', error)
    res.status(500).json({ error: error.message })
  }
})

app.listen(process.env.PORT || 3001, () => console.log('Server running'))