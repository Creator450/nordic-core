import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Kitchen from './Kitchen.jsx'
import Bar from './Bar.jsx'
import LaGunaKitchen from './LaGunaKitchen.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/kitchen" element={<Kitchen />} />
        <Route path="/bar" element={<Bar />} />
        <Route path="/laguna-kitchen" element={<LaGunaKitchen />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
