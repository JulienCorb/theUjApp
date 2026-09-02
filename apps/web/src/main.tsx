import ReactDOM from 'react-dom/client'
import { StrictMode } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { getRouter } from './router'
import { queryClient } from './lib/query-client'
import { initI18n } from './lib/i18n'

initI18n()

const router = getRouter()

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}
