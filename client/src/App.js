import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import Login from './components/Login'
import SignUp from './components/SignUp'
import Dashboard from './components/Dashboard'
import Home from './components/Home'
import configData from './config.json'

function App () {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={configData.PATH.LOGIN} element={<Login />} />
        <Route path={configData.PATH.REGISTER} element={<SignUp />} />
        <Route path={configData.PATH.DASHBOARD} element={<Dashboard />} />
        {/* <Route path={configData.PATH.VERIFY} element={<EmailVerify />} /> */}
        <Route path='*' element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
