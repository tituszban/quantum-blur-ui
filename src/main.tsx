import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FirebaseContextProvider } from './hooks/firebase.tsx';
import { ThemeProvider } from './hooks/theme.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FirebaseContextProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </FirebaseContextProvider>
  </React.StrictMode>,
);
