import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

// React 18의 동시성 기능 활성화
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);