import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FirebaseContextProvider } from './hooks/firebase.tsx';
import { ThemeProvider } from './hooks/theme.tsx';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { Toaster } from "@/components/toast/toaster.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <FirebaseContextProvider>
        <ThemeProvider>
          <App />
          <Toaster />
        </ThemeProvider>
      </FirebaseContextProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
