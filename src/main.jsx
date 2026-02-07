import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ProviderAuth } from './store';
import App from './app/App.jsx';
import './estilos/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ProviderAuth>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ProviderAuth>
  </React.StrictMode>
);
