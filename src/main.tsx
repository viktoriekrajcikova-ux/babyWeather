import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/scss/main.scss';
import './i18n/i18n';

import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './app/App';
import Providers from './app/providers';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>,
);
