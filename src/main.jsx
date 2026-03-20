import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Kitchen from './Kitchen.jsx'
import Bar from './Bar.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/kitchen" element={<Kitchen />} />
        <Route path="/bar" element={<Bar />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
