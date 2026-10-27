import { lazy } from 'react'

/**
 * Écrans chargés à la demande.
 *
 * Tous sauf le tableau de bord, qu'on voit en arrivant : le mettre derrière
 * un chargement différé ajouterait un aller-retour avant le premier
 * affichage. Les autres partent chacun dans leur fichier, ce qui sort du
 * paquet initial les dépendances qu'ils sont seuls à utiliser. `hanzi-writer`
 * pèse à lui seul près de 900 ko sur le disque et ne sert que sur une fiche
 * de caractère.
 *
 * Le service worker précharge l'ensemble : hors ligne, rien ne change.
 *
 * Ils vivent dans leur propre fichier plutôt que dans `router.tsx` pour que
 * chaque module n'exporte qu'une seule sorte de chose — des composants ici,
 * la table de routage là. C'est ce que demande le rafraîchissement à chaud.
 */

export const CaractereScreen = lazy(async () => ({
  default: (await import('@/features/caracteres/CaractereScreen')).CaractereScreen,
}))
export const DialogueScreen = lazy(async () => ({
  default: (await import('@/features/dialogues/DialogueScreen')).DialogueScreen,
}))
export const DialoguesScreen = lazy(async () => ({
  default: (await import('@/features/dialogues/DialoguesScreen')).DialoguesScreen,
}))
export const ExamenScreen = lazy(async () => ({
  default: (await import('@/features/examens/ExamenScreen')).ExamenScreen,
}))
export const ExamensScreen = lazy(async () => ({
  default: (await import('@/features/examens/ExamensScreen')).ExamensScreen,
}))
export const GrammaireScreen = lazy(async () => ({
  default: (await import('@/features/grammaire/GrammaireScreen')).GrammaireScreen,
}))
export const PointScreen = lazy(async () => ({
  default: (await import('@/features/grammaire/PointScreen')).PointScreen,
}))
export const LectureScreen = lazy(async () => ({
  default: (await import('@/features/lecture/LectureScreen')).LectureScreen,
}))
export const TexteScreen = lazy(async () => ({
  default: (await import('@/features/lecture/TexteScreen')).TexteScreen,
}))
export const EcouteScreen = lazy(async () => ({
  default: (await import('@/features/prononciation/EcouteScreen')).EcouteScreen,
}))
export const PrononcerScreen = lazy(async () => ({
  default: (await import('@/features/prononciation/PrononcerScreen')).PrononcerScreen,
}))
export const PrononciationScreen = lazy(async () => ({
  default: (await import('@/features/prononciation/PrononciationScreen'))
    .PrononciationScreen,
}))
export const ReglagesScreen = lazy(async () => ({
  default: (await import('@/features/reglages/ReglagesScreen')).ReglagesScreen,
}))
export const RevisionsScreen = lazy(async () => ({
  default: (await import('@/features/revisions/RevisionsScreen')).RevisionsScreen,
}))
export const NiveauScreen = lazy(async () => ({
  default: (await import('@/features/vocabulaire/NiveauScreen')).NiveauScreen,
}))
export const UniteScreen = lazy(async () => ({
  default: (await import('@/features/vocabulaire/UniteScreen')).UniteScreen,
}))
