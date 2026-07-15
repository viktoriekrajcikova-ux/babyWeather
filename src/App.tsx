import {
  BrowserRouter,
  Route,
  Routes
} from 'react-router-dom';
import Home from "./screens/home";
import Settings from "./screens/settings";
import Login from "./screens/login";
import ProtectedRoute from "./components/protectedRoute";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="login" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}


export default App
