import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './hooks/useAuth'
import { AppProvider } from './context/AppContext'
import { DataProvider } from './context/DataContext'

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <AppProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </AppProvider>
    </AuthProvider>
  </React.StrictMode>
);
