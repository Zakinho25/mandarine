import { createHashRouter } from 'react-router-dom'
import { Layout } from './Layout'
import {
  CaractereScreen,
  DialogueScreen,
  DialoguesScreen,
  EcouteScreen,
  ExamenScreen,
  ExamensScreen,
  GrammaireScreen,
  LectureScreen,
  NiveauScreen,
  PointScreen,
  PrononcerScreen,
  PrononciationScreen,
  ReglagesScreen,
  RevisionsScreen,
  TexteScreen,
  UniteScreen,
} from './ecrans'
import { ParcoursScreen } from '@/features/parcours/ParcoursScreen'

/**
 * Routage par ancre (`/#/revisions`).
 *
 * Choix délibéré : GitHub Pages ne sait pas rediriger les routes inconnues
 * vers `index.html`, donc un lien profond en routage classique renverrait une
 * 404 au premier chargement. L'ancre évite ce problème sans serveur, sans
 * fichier de redirection et sans coût.
 *
 * Tous les écrans sont chargés à la demande sauf le tableau de bord ; le
 * détail est dans `ecrans.tsx`.
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
      { path: 'grammaire', element: <GrammaireScreen /> },
      { path: 'grammaire/:id', element: <PointScreen /> },
      { path: 'examens', element: <ExamensScreen /> },
      { path: 'examens/:level/:longueur/:seed', element: <ExamenScreen /> },
      { path: 'reglages', element: <ReglagesScreen /> },
    ],
  },
])
