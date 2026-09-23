import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/auth/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import './assets/scss/main.scss';
import 'bootstrap/dist/css/bootstrap.min.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
