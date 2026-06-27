import {
  BrowserRouter,
  Route,
  Routes
} from 'react-router-dom';
import Home from "./screens/home";
import Settings from "./screens/settings";
import Login from "./screens/login";
import ProtectedRoute from "./components/protectedRoute";

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
