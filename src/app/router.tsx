import { createHashRouter } from 'react-router-dom'
import { Layout } from './Layout'
import { ParcoursScreen } from '@/features/parcours/ParcoursScreen'
import { ReglagesScreen } from '@/features/reglages/ReglagesScreen'
import { CaractereScreen } from '@/features/caracteres/CaractereScreen'
import { DialogueScreen } from '@/features/dialogues/DialogueScreen'
import { DialoguesScreen } from '@/features/dialogues/DialoguesScreen'
import { LectureScreen } from '@/features/lecture/LectureScreen'
import { TexteScreen } from '@/features/lecture/TexteScreen'
import { EcouteScreen } from '@/features/prononciation/EcouteScreen'
import { PrononcerScreen } from '@/features/prononciation/PrononcerScreen'
import { PrononciationScreen } from '@/features/prononciation/PrononciationScreen'
import { RevisionsScreen } from '@/features/revisions/RevisionsScreen'
import { NiveauScreen } from '@/features/vocabulaire/NiveauScreen'
import { UniteScreen } from '@/features/vocabulaire/UniteScreen'

/**
 * Routage par ancre (`/#/revisions`).
 *
 * Choix délibéré : GitHub Pages ne sait pas rediriger les routes inconnues
 * vers `index.html`, donc un lien profond en routage classique renverrait une
 * 404 au premier chargement. L'ancre évite ce problème sans serveur, sans
 * fichier de redirection et sans coût.
 */
export const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <ParcoursScreen /> },
      { path: 'niveau/:level', element: <NiveauScreen /> },
      { path: 'unite/:id', element: <UniteScreen /> },
      { path: 'caractere/:character', element: <CaractereScreen /> },
      { path: 'prononciation', element: <PrononciationScreen /> },
      { path: 'prononciation/ecoute', element: <EcouteScreen /> },
      { path: 'prononciation/prononcer', element: <PrononcerScreen /> },
      { path: 'revisions', element: <RevisionsScreen /> },
      { path: 'lecture', element: <LectureScreen /> },
      { path: 'lecture/:id', element: <TexteScreen /> },
      { path: 'dialogues', element: <DialoguesScreen /> },
      { path: 'dialogues/:id', element: <DialogueScreen /> },
      { path: 'reglages', element: <ReglagesScreen /> },
    ],
  },
])
