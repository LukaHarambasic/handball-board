// End-to-end check that an installed copy picks up new releases, in WebKit.
// Builds release A, serves it, then publishes B, C… into the same folder and checks every
// update path. Run with `npm run test:update` (needs `npx playwright install webkit`).
import { webkit, devices } from '@playwright/test'
import { execSync, spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PORT = 4173 // a port WebKit is allowed to reach in sandboxed runs
const out = mkdtempSync(join(tmpdir(), 'handball-update-'))
const build = (ref) => execSync(`npx vite build --outDir ${out} --emptyOutDir`, { stdio: 'ignore', env: { ...process.env, COMMIT_REF: ref } })
let failed = false
const check = (ok, msg) => {
  console.log(`${ok ? '✓' : '✗'} ${msg}`)
  if (!ok) failed = true
}

build('aaaaaaa')
const server = spawn('npx', ['vite', 'preview', '--outDir', out, '--port', String(PORT), '--strictPort'], { stdio: 'ignore' })
const browser = await webkit.launch()
try {
  for (let i = 0; i < 40; i++) {
    try {
      if ((await fetch(`http://localhost:${PORT}/`)).ok) break
    } catch {}
    await new Promise((r) => setTimeout(r, 250))
  }
  const page = await (await browser.newContext({ ...devices['iPad Pro 11 landscape'] })).newPage()
  page.setDefaultTimeout(15000)
  const shownVersion = async () => {
    await page.getByRole('button', { name: /^Canvases, current:/ }).click()
    const v = (await page.getByText(/^Version /).textContent()) ?? ''
    await page.keyboard.press('Escape')
    return v
  }
  const setVisibility = (state) =>
    page.evaluate((s) => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => s })
      document.dispatchEvent(new Event('visibilitychange'))
    }, state)
  const players = () => page.locator('.board [data-token-id]').count()
  const useBoard = () => page.locator('.board').click({ position: { x: 300, y: 300 } })

  await page.goto(`http://localhost:${PORT}/`)
  await page.getByRole('button', { name: 'Place 6 v 6 in standard positions' }).click()

  // 1. Board in use: returning to the app finds the update, a tap applies it.
  for (const ref of ['bbbbbbb', 'ccccccc']) {
    build(ref)
    await useBoard()
    await setVisibility('visible')
    const button = page.getByRole('button', { name: /^Update ready/ })
    const shown = await button.waitFor().then(() => true, () => false)
    check(shown, `${ref}: "Update ready" appears after returning to the app`)
    if (!shown) continue
    await Promise.all([page.waitForEvent('load', { timeout: 20000 }), button.click()])
    await page.waitForSelector('.board')
    check((await shownVersion()).includes(ref), `${ref}: tapping it reloads into the new version`)
    check((await players()) === 12, `${ref}: the board is kept`)
  }

  // 2. Never mid-timeout: with the board in use the update waits, then applies when the app is put away.
  build('ddddddd')
  await useBoard()
  await setVisibility('visible')
  await page.getByRole('button', { name: /^Update ready/ }).waitFor()
  check((await shownVersion()).includes('ccccccc'), 'ddddddd: not applied while the board is in use')
  await Promise.all([page.waitForEvent('load', { timeout: 20000 }), setVisibility('hidden')])
  await page.waitForSelector('.board')
  check((await shownVersion()).includes('ddddddd'), 'ddddddd: applied when the app is put away')

  // 3. At launch, before the board is touched, a waiting update is applied straight away.
  build('eeeeeee')
  await Promise.all([page.waitForEvent('load', { timeout: 20000 }), page.reload()])
  await page.waitForFunction(() => document.readyState === 'complete')
  await page.waitForTimeout(3500)
  await page.waitForSelector('.board')
  check((await shownVersion()).includes('eeeeeee'), 'eeeeeee: applied at launch before the board is touched')

  // 4. Still works offline afterwards.
  await page.context().setOffline(true)
  await page.reload()
  check(await page.waitForSelector('.board').then(() => true, () => false), 'loads offline after updating')
} finally {
  await browser.close()
  server.kill()
  rmSync(out, { recursive: true, force: true })
}
process.exit(failed ? 1 : 0)
