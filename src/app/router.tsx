import { createHashRouter } from 'react-router-dom'
import { Layout } from './Layout'
import { ParcoursScreen } from '@/features/parcours/ParcoursScreen'
import { ReglagesScreen } from '@/features/reglages/ReglagesScreen'
import { CaractereScreen } from '@/features/caracteres/CaractereScreen'
import { EcouteScreen } from '@/features/prononciation/EcouteScreen'
import { PrononciationScreen } from '@/features/prononciation/PrononciationScreen'
import { RevisionsScreen } from '@/features/revisions/RevisionsScreen'
import { NiveauScreen } from '@/features/vocabulaire/NiveauScreen'
import { Placeholder } from '@/ui/Placeholder'

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
      { path: 'caractere/:character', element: <CaractereScreen /> },
      { path: 'prononciation', element: <PrononciationScreen /> },
      { path: 'prononciation/ecoute', element: <EcouteScreen /> },
      { path: 'revisions', element: <RevisionsScreen /> },
      {
        path: 'lecture',
        element: (
          <Placeholder
            title="Lecture graduée"
            milestone={7}
            description="Textes courts classés par niveau, mots cliquables et pourcentage de mots connus. Les textes seront segmentés à l'avance, pour que toucher un mot renvoie exactement l'unité de vocabulaire enseignée."
          />
        ),
      },
      {
        path: 'dialogues',
        element: (
          <Placeholder
            title="Dialogues guidés"
            milestone={8}
            description="Des conversations écrites à l'avance et contraintes à ton niveau : commander au restaurant, prendre un taxi, se présenter. Ce ne sera pas une IA — l'application fonctionne sans aucun service payant."
          />
        ),
      },
      { path: 'reglages', element: <ReglagesScreen /> },
    ],
  },
])
