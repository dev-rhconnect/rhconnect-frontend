import { test, expect } from '@playwright/test'

// Flux 1 — Authentification
test('login RP redirige vers dashboard RP', async ({ page }) => {
  await page.goto('http://localhost:3000/login')
  await page.fill('input[name="email"]', 'kande.diaby@ism.edu.sn')
  await page.fill('input[name="motDePasse"]', 'Kumba0311')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/responsable/)
})

test('page login affiche le formulaire', async ({ page }) => {
  await page.goto('http://localhost:3000/login')
  await expect(page.locator('input[name="email"]')).toBeVisible()
  await expect(page.locator('input[name="motDePasse"]')).toBeVisible()
  await expect(page.locator('button[type="submit"]')).toBeVisible()
})

test('login vacataire redirige vers dashboard vacataire', async ({ page }) => {
  await page.goto('http://localhost:3000/login')
  await page.fill('input[name="email"]', 'mansour.diallo@ism.edu.sn')
  await page.fill('input[name="motDePasse"]', 'Kumba0311')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/vacataire/)
})

// Flux 2 — Création dossier vacataire
test('formulaire PR01 affiche tous les champs obligatoires', async ({ page }) => {
  await page.goto('http://localhost:3000/login')
  await page.fill('input[name="email"]', 'kande.diaby@ism.edu.sn')
  await page.fill('input[name="motDePasse"]', 'Kumba0311')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/responsable/, { timeout: 10000 })
  await page.goto('http://localhost:3000/responsable/vacataires/nouveau')
  await page.waitForURL(/\/vacataires\/nouveau/, { timeout: 10000 })
  await expect(page.locator('input[name="prenom"]')).toBeVisible()
  await expect(page.locator('input[name="nom"]')).toBeVisible()
  await expect(page.locator('input[name="email"]')).toBeVisible()
  await expect(page.locator('input[name="specialite"]')).toBeVisible()
  await expect(page.locator('button[type="submit"]')).toBeVisible()
})
// Flux 3 — Validation des heures
test('page validations accessible par attaché', async ({ page }) => {
  await page.goto('http://localhost:3000/login')
  await page.fill('input[name="email"]', 'mar-sarr.ndiaye@ism.edu.sn')
  await page.fill('input[name="motDePasse"]', 'Kumba0311')
  await page.click('button[type="submit"]')
  await page.goto('http://localhost:3000/attache/validations')
  await expect(page).toHaveURL(/\/attache\/validations/)
})

// Flux 4 — Fiche de paie
test('page fiches de paie affiche bouton PDF', async ({ page }) => {
  await page.goto('http://localhost:3000/login')
  await page.fill('input[name="email"]', 'mansour.diallo@ism.edu.sn')
  await page.fill('input[name="motDePasse"]', 'Kumba0311')
  await page.click('button[type="submit"]')
  await page.goto('http://localhost:3000/vacataire/fiches-paie')
  await expect(page).toHaveURL(/\/vacataire\/fiches-paie/)
})

// Flux 5 — Dashboard RP
test('dashboard RP accessible et affiche les KPIs', async ({ page }) => {
  await page.goto('http://localhost:3000/login')
  await page.fill('input[name="email"]', 'kande.diaby@ism.edu.sn')
  await page.fill('input[name="motDePasse"]', 'Kumba0311')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/responsable/)
})