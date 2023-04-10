import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from './components/Login'
import SignUp from './components/SignUp'
import Dashboard from './components/Dashboard'
import Home from './components/Home'
import Activate from './components/Activate'
import ChangePassword from './components/ChangePassword'
import ForgetPassword from './components/ForgetPassword'
import ResetPassword from './components/ResetPassword'
import configData from './config.json'

function App () {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={configData.PATH.LOGIN} element={<Login />} />
        <Route path={configData.PATH.REGISTER} element={<SignUp />} />
        <Route path={configData.PATH.DASHBOARD} element={<Dashboard />} />
        <Route path={configData.PATH.ACTIVATE} element={<Activate />} />
        <Route
          path={configData.PATH.CHANGEPASSWORD}
          element={<ChangePassword />}
        />
        <Route
          path={configData.PATH.FORGETPASSWORD}
          element={<ForgetPassword />}
        />
        <Route
          path={configData.PATH.RESETPASSWORD}
          element={<ResetPassword />}
        />
        <Route path='*' element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
