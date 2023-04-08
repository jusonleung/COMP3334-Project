import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
/* import Dashboard from "./components/Dashboard";
import EmailVerify from "./components/EmailVerify"; */

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Login />} />
                <Route path='/register' element={<SignUp />} />
                {/* <Route path='/dashboard' element={<Dashboard />} />
                <Route path='email/verify' element={<EmailVerify />} /> */}
            </Routes>
        </BrowserRouter>
    );
}

export default App;