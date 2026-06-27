import {
  BrowserRouter,
  Route,
  Routes
} from 'react-router-dom';
import Home from "./screens/home.jsx";
import Settings from "./screens/settings";
import Login from "./screens/login.jsx";
import ProtectedRoute from "./components/protectedRoute.jsx";

const App = () => {
  return (
      <BrowserRouter>
        <Routes>
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="login" element={<Login />} />
        </Routes>
      </BrowserRouter>
  )
}


export default App
