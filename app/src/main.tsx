import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'

import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Auth0ProviderWithNavigate } from './Auth0ProviderWithNavigate'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Auth0ProviderWithNavigate>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </Auth0ProviderWithNavigate>
    </BrowserRouter>
  </StrictMode>
)
