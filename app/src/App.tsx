import { BrowserRouter, Route, Routes } from 'react-router'
import './App.css'
import { Form } from './pages/Form'
import { Home } from './pages/Home'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/form" element={<Form />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
