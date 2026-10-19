/** Les trois étapes du parcours, telles qu'annoncées à l'utilisateur. */
export const LEVEL_TITLES: Readonly<Record<number, string>> = {
  1: 'Fondations',
  2: 'Structures de base',
  3: 'Autonomie',
}

export const LEVEL_GOALS: Readonly<Record<number, string>> = {
  1: 'Se présenter, les nombres, la famille, les objets du quotidien.',
  2: 'Relier ses phrases, parler du passé et du futur proche, comparer.',
  3: 'Se débrouiller seul : transports, santé, travail, opinions simples.',
}

export function levelTitle(level: number): string {
  return LEVEL_TITLES[level] ?? `Niveau ${String(level)}`
}
