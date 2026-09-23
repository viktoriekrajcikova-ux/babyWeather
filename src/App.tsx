import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './screens/home/home';
import Overview from './screens/overview/overview';
import Settings from './screens/settings/settings';
import Login from './screens/login/login';
import ProtectedRoute from './components/route/protectedRoute';

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
