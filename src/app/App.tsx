import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from '../pages/home/home';
import Overview from '../pages/overview/overview';
import Settings from '../pages/settings/settings';
import Login from '../pages/login/login';
import ProtectedRoute from '../features/auth/components/protectedRoute';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="overview"
          element={
            <ProtectedRoute>
              <Overview />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
