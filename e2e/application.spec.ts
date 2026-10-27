import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

/**
 * Ce que seul un vrai navigateur peut prouver.
 *
 * Les 455 tests unitaires et de composants tournent dans jsdom, qui n'a ni
 * IndexedDB réel, ni chargement différé de modules, ni service worker. Trois
 * choses restent donc invérifiables ailleurs qu'ici :
 *
 *  - la progression survit-elle à un rechargement de page ;
 *  - les écrans découpés se chargent-ils quand on navigue ;
 *  - un lien profond fonctionne-t-il au premier chargement, ce qui est toute
 *    la raison d'être du routage par ancre.
 */

interface PointGrammaire {
  readonly id: string
  readonly titre: string
  readonly ordre: {
    readonly morceaux: readonly { readonly text: string }[]
  }
}

/** Le contenu réel, lu sur le disque : le test suit les fiches, pas l'inverse. */
function premierPoint(level: number): PointGrammaire {
  const fichier = JSON.parse(
    readFileSync(`public/content/grammaire/niveau-${String(level)}.json`, 'utf8'),
  ) as { points: PointGrammaire[] }
  const point = fichier.points[0]
  if (point === undefined) throw new Error('aucun point de grammaire généré')
  return point
}

async function allerA(page: Page, route: string): Promise<void> {
  await page.goto(`/#${route}`)
  await expect(page.getByRole('main')).toBeVisible()
}

test.describe('démarrage', () => {
  test('affiche le tableau de bord avec le vrai contenu', async ({ page }) => {
    await allerA(page, '/')

    await expect(page.getByRole('heading', { name: 'Mandarine' })).toBeVisible()
    await expect(page.getByText('0 / 1000')).toBeVisible()
    await expect(page.getByRole('link', { name: /HSK 1/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /HSK 3/ })).toBeVisible()
  })

  test('ne laisse aucune erreur dans la console', async ({ page }) => {
    const erreurs: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') erreurs.push(message.text())
    })
    page.on('pageerror', (error) => erreurs.push(error.message))

    await allerA(page, '/')
    await page.getByRole('link', { name: 'Grammaire' }).click()
    await expect(page.getByRole('heading', { name: 'Grammaire' })).toBeVisible()

    expect(erreurs).toEqual([])
  })

  test('ouvre un lien profond dès le premier chargement', async ({ page }) => {
    // C'est la raison d'être du routage par ancre : GitHub Pages ne sait pas
    // rediriger une route inconnue vers index.html.
    const point = premierPoint(3)
    await page.goto(`/#/grammaire/${point.id}`)
    await expect(page.getByRole('heading', { name: point.titre })).toBeVisible()
  })
})

test.describe('navigation', () => {
  test('charge chaque écran à la demande', async ({ page }) => {
    await allerA(page, '/')

    for (const [onglet, titre] of [
      ['Grammaire', 'Grammaire'],
      ['Lecture', 'Lecture'],
      ['Dialogues', 'Dialogues guidés'],
      ['Réglages', 'Réglages'],
    ] as const) {
      await page.getByRole('link', { name: onglet, exact: true }).click()
      await expect(page.getByRole('heading', { level: 1, name: titre })).toBeVisible()
    }
  })

  test('affiche un message plutôt qu’une page blanche si un écran manque', async ({
    page,
  }) => {
    // La panne que le découpage des écrans a rendue possible : un fichier qui
    // n'arrive pas. La barrière recharge une fois, puis explique, au lieu de
    // laisser React démonter toute l'application.
    await page.route('**/assets/GrammaireScreen-*.js', async (route) => route.abort())

    await allerA(page, '/')
    await page.getByRole('link', { name: 'Grammaire', exact: true }).click()

    await expect(
      page.getByRole('heading', { name: 'Cet écran n’a pas pu être chargé' }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Revenir au tableau de bord' }),
    ).toBeVisible()
  })

  test('donne un lien d’évitement au clavier', async ({ page, browserName }) => {
    // Safari n'amène pas le focus sur les liens avec Tab tant que « naviguer
    // entre les éléments avec Tab » n'est pas activé dans ses réglages. C'est
    // un choix du navigateur, pas un défaut de la page : le lien existe et
    // fonctionne une fois l'option cochée.
    test.skip(browserName === 'webkit', 'Tab ne cible pas les liens par défaut')
    await allerA(page, '/')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Aller au contenu' })).toBeFocused()
  })
})

test.describe('progression', () => {
  test('survit à un rechargement de page', async ({ page }) => {
    // Le cœur du sujet : IndexedDB, pour de vrai, dans un vrai navigateur.
    const point = premierPoint(1)
    await page.goto(`/#/grammaire/${point.id}`)
    await expect(page.getByRole('heading', { name: point.titre })).toBeVisible()

    for (const morceau of point.ordre.morceaux) {
      await page.getByRole('button', { name: `Placer ${morceau.text}` }).click()
    }
    await page.getByRole('button', { name: 'Vérifier' }).click()
    await expect(page.getByText('C’est l’ordre juste.')).toBeVisible()

    await page.goto('/#/grammaire')
    await expect(page.getByText('1 / 48')).toBeVisible()

    await page.reload()
    await expect(page.getByText('1 / 48')).toBeVisible()
  })

  test('conserve un réglage après rechargement', async ({ page }) => {
    await allerA(page, '/reglages')

    const clair = page.getByRole('button', { name: 'Clair', exact: true })
    await clair.click()
    await expect(clair).toHaveAttribute('aria-pressed', 'true')

    await page.reload()
    await expect(
      page.getByRole('button', { name: 'Clair', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  test('exporte une sauvegarde lisible', async ({ page }) => {
    await allerA(page, '/reglages')

    const telechargement = page.waitForEvent('download')
    await page.getByRole('button', { name: /Exporter/ }).click()
    const fichier = await telechargement

    expect(fichier.suggestedFilename()).toMatch(/^mandarine-\d{4}-\d{2}-\d{2}\.json$/)

    const chemin = await fichier.path()
    const contenu = JSON.parse(readFileSync(chemin, 'utf8')) as {
      format: string
      version: number
      examResults: unknown[]
      grammarStats: unknown[]
    }
    expect(contenu.format).toBe('mandarine-sauvegarde')
    expect(contenu.version).toBe(2)
    expect(Array.isArray(contenu.examResults)).toBe(true)
    expect(Array.isArray(contenu.grammarStats)).toBe(true)
  })
})

test.describe('examen blanc', () => {
  test('se déroule de bout en bout et rend un bilan', async ({ page }) => {
    await allerA(page, '/examens')

    await page.getByRole('button', { name: 'HSK 1' }).click()
    await page.getByRole('button', { name: 'Épreuve courte' }).click()
    await page.getByRole('button', { name: 'Commencer' }).click()

    for (const titre of ['Compréhension orale', 'Compréhension écrite']) {
      await expect(page.getByRole('heading', { level: 1, name: titre })).toBeVisible()
      await page.getByRole('button', { name: 'Démarrer le chrono' }).click()

      // On répond à tout en prenant la première proposition : le score n'a
      // aucune importance ici, c'est le déroulé qu'on éprouve.
      for (let question = 1; question <= 12; question += 1) {
        await expect(page.getByText(`Question ${String(question)} sur 12`)).toBeVisible()
        await page.getByRole('main').getByRole('button').nth(2).click()
        const dernier = question === 12
        await page
          .getByRole('button', { name: dernier ? 'Terminer cette épreuve' : 'Suivante' })
          .click()
      }
    }

    await expect(page.getByRole('heading', { level: 1, name: 'Bilan' })).toBeVisible()
    await expect(page.getByText(/bonnes réponses sur 24/)).toBeVisible()

    // L'examen passé doit figurer dans l'historique au retour.
    await page.getByRole('link', { name: 'Retour aux examens' }).click()
    await expect(page.getByRole('heading', { name: 'Tes résultats' })).toBeVisible()
  })
})

test.describe('hors ligne', () => {
  test('enregistre un service worker qui précharge le contenu', async ({ page }) => {
    await allerA(page, '/')

    const enregistre = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false
      const registration = await navigator.serviceWorker.getRegistration()
      return registration !== undefined
    })
    expect(enregistre).toBe(true)
  })
})
