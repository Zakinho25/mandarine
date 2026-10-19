import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { requestPersistentStorage } from './data/db'
import './index.css'

const container = document.getElementById('root')
if (container === null) {
  throw new Error('Élément racine #root introuvable dans index.html.')
}

// Demandé au plus tôt : les navigateurs accordent la persistance du stockage
// plus volontiers à une application installée et réellement utilisée.
void requestPersistentStorage()

createRoot(container).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
