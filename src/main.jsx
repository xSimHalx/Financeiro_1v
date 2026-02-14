import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ProviderAuth } from './store';
import App from './app/App.jsx';
import { checkHealth } from './services/api.js';
import './estilos/index.css';

// Teste de conectividade ao carregar
checkHealth().then((r) => {
  if (r.ok) console.log('[API] OK – servidor acessível');
  else console.warn('[API] Falha ao conectar:', r.error);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ProviderAuth>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ProviderAuth>
  </React.StrictMode>
);
