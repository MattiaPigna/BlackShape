import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Tablet from './pages/Tablet'
import Admin from './pages/Admin'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/tablet" element={<Tablet />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  )
}
