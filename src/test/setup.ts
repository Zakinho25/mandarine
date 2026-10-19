import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Sans les globales de Vitest, le nettoyage automatique de Testing Library ne
// s'enregistre pas : les rendus s'accumuleraient d'un test a l'autre et les
// requetes trouveraient plusieurs fois le meme bouton.
afterEach(cleanup)
