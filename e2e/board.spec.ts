import { expect, test, type Page } from '@playwright/test'

/** Dispatches a touch pointer event at a screen point, like a finger on the iPad. */
async function touch(page: Page, type: 'pointerdown' | 'pointermove' | 'pointerup', id: number, x: number, y: number) {
  await page.evaluate(
    ([type, id, x, y]) => {
      const target = document.elementFromPoint(x as number, y as number) ?? document.body
      target.dispatchEvent(
        new PointerEvent(type as string, {
          bubbles: true,
          cancelable: true,
          composed: true,
          pointerId: id as number,
          pointerType: 'touch',
          isPrimary: id === 1,
          clientX: x as number,
          clientY: y as number,
          button: 0,
          buttons: type === 'pointerup' ? 0 : 1,
        }),
      )
    },
    [type, id, x, y] as const,
  )
}

async function swipe(page: Page, id: number, from: [number, number], to: [number, number], steps = 12) {
  await touch(page, 'pointerdown', id, ...from)
  for (let i = 1; i <= steps; i++) {
    await touch(page, 'pointermove', id, from[0] + ((to[0] - from[0]) * i) / steps, from[1] + ((to[1] - from[1]) * i) / steps)
  }
  await touch(page, 'pointerup', id, ...to)
}

const courtMenuButton = (page: Page) => page.getByRole('button', { name: /^Court:/ })
const clearButton = (page: Page) => page.getByRole('button', { name: 'Clear the court' })
const eraserButton = (page: Page) => page.getByRole('button', { name: /^Eraser/ })
/** 6 v 6 goes on the left half, so the right half stays empty: right in landscape, bottom in portrait. */
const emptyHalf = (page: Page, fx: number, fy: number) => emptyCourt(page, 0.5 + fx / 2, 0.5 + fy / 2)
const tokens = (page: Page) => page.locator('.board [data-token-id]')
const strokes = (page: Page) => page.locator('.board .strokes path[data-stroke-id]')

async function center(page: Page, selector: string) {
  const box = await page.locator(selector).first().boundingBox()
  if (!box) throw new Error(`no box for ${selector}`)
  return [box.x + box.width / 2, box.y + box.height / 2] as [number, number]
}

/** A point on empty court, a third of the way in from the top-left corner. */
async function emptyCourt(page: Page, fx = 0.3, fy = 0.6): Promise<[number, number]> {
  const box = await page.locator('.board > g > g rect').first().boundingBox()
  if (!box) throw new Error('court not rendered')
  return [box.x + box.width * fx, box.y + box.height * fy]
}

const errors: string[] = []

test.beforeEach(async ({ page }) => {
  errors.length = 0
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(page.locator('.board')).toBeVisible()
})

test.afterEach(() => {
  expect(errors, 'no console errors or CSP violations').toEqual([])
})

test('dragging from the tray spawns a token under the finger', async ({ page }) => {
  const from = await center(page, '#tray-defense')
  const to = await emptyCourt(page)
  await swipe(page, 1, from, to)
  await expect(tokens(page)).toHaveCount(1)
  const [x, y] = await center(page, '.board [data-token-id] rect')
  expect(Math.abs(x - to[0])).toBeLessThan(3)
  expect(Math.abs(y - to[1])).toBeLessThan(3)
  await expect(tokens(page).first()).toHaveAttribute('aria-label', 'Defender 1')
})

test('tapping a tray places a token; tokens move and delete via the delete zone', async ({ page }) => {
  const tray = await center(page, '#tray-attack')
  await touch(page, 'pointerdown', 1, ...tray)
  await touch(page, 'pointerup', 1, ...tray)
  await expect(tokens(page)).toHaveCount(1)

  const zone = page.locator('.delete-zone')
  await expect(zone).toHaveAttribute('data-visible', 'false')

  // Move it twice.
  let at = await center(page, '.board [data-token-id] polygon')
  const dest = await emptyCourt(page, 0.6, 0.6)
  await swipe(page, 1, at, dest)
  at = await center(page, '.board [data-token-id] polygon')
  expect(Math.abs(at[0] - dest[0])).toBeLessThan(4)
  await swipe(page, 1, at, await emptyCourt(page, 0.7, 0.4))

  // Drag to the delete zone: it appears during the drag, turns red over it, deletes on release.
  at = await center(page, '.board [data-token-id] polygon')
  const z = await center(page, '.delete-zone')
  await touch(page, 'pointerdown', 1, ...at)
  await touch(page, 'pointermove', 1, at[0] + 20, at[1])
  await expect(zone).toHaveAttribute('data-visible', 'true')
  await touch(page, 'pointermove', 1, ...z)
  await expect(zone).toHaveAttribute('data-over', 'true')
  await touch(page, 'pointerup', 1, ...z)
  await expect(tokens(page)).toHaveCount(0)
  await expect(zone).toHaveAttribute('data-visible', 'false')
})

test('the delete zone spans the full width down to the court line; players can be dropped anywhere on the court', async ({ page }) => {
  const vp = page.viewportSize()!
  const courtLine = (await page.locator('.board > g > g rect').first().boundingBox())!.y
  const zone = (await page.locator('.delete-zone').boundingBox())!
  expect(zone.y).toBe(0)
  expect(zone.width).toBe(vp.width)
  expect(zone.height).toBeCloseTo(Math.max(72, courtLine), 0)

  await page.getByRole('button', { name: 'Place 6 v 6 in standard positions' }).click()
  // Just below the top line, at the far right: the player stays.
  await swipe(page, 1, await center(page, '.board [data-token-id] rect'), [vp.width - 40, zone.height + 12])
  await expect(tokens(page)).toHaveCount(12)
  // Above the line, anywhere across the width: deleted.
  await swipe(page, 1, await center(page, '.board [data-token-id] rect'), [30, zone.height / 2])
  await expect(tokens(page)).toHaveCount(11)
})

test('6 v 6 places twelve players in one tap', async ({ page }) => {
  await page.getByRole('button', { name: 'Place 6 v 6 in standard positions' }).click()
  await expect(tokens(page)).toHaveCount(12)
  await expect(page.locator('.board [data-token-id] rect')).toHaveCount(6)
  await expect(page.locator('.board [data-token-id] polygon')).toHaveCount(6)
})

test('a finger on empty court draws; Clear removes players and lines', async ({ page }) => {
  await expect(clearButton(page)).toBeDisabled()
  await page.getByRole('button', { name: 'Place 6 v 6 in standard positions' }).click()
  await swipe(page, 1, await emptyHalf(page, 0.2, 0.2), await emptyHalf(page, 0.7, 0.6))
  await swipe(page, 1, await emptyHalf(page, 0.3, 0.7), await emptyHalf(page, 0.6, 0.9))
  await expect(strokes(page)).toHaveCount(2)
  await clearButton(page).click()
  await expect(strokes(page)).toHaveCount(0)
  await expect(tokens(page)).toHaveCount(0)
  await expect(clearButton(page)).toBeDisabled()
  await expect(page.getByRole('status')).toHaveText('Court cleared')
})

test('6 v 6 goes on the left half of the full court', async ({ page }) => {
  await page.getByRole('button', { name: 'Place 6 v 6 in standard positions' }).click()
  const court = (await page.locator('.board > g > g rect').first().boundingBox())!
  const portrait = (await page.locator('.app').getAttribute('data-orientation')) === 'portrait'
  for (const t of await tokens(page).all()) {
    const b = (await t.boundingBox())!
    if (portrait) expect(b.y + b.height / 2).toBeLessThan(court.y + court.height / 2)
    else expect(b.x + b.width / 2).toBeLessThan(court.x + court.width / 2)
  }
})

test('line colour: the pen menu sets the colour of new lines', async ({ page }) => {
  await swipe(page, 1, await emptyHalf(page, 0.2, 0.2), await emptyHalf(page, 0.7, 0.4))
  await page.getByRole('button', { name: 'Line colour: Black' }).click()
  await page.getByRole('menuitemradio', { name: 'Orange' }).click()
  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Line colour: Orange' })).toBeVisible()
  await swipe(page, 1, await emptyHalf(page, 0.2, 0.7), await emptyHalf(page, 0.7, 0.9))
  await expect(strokes(page).nth(0)).toHaveAttribute('fill', '#1B2230')
  await expect(strokes(page).nth(1)).toHaveAttribute('fill', '#C2410C')
  // Remembered after a reload.
  await page.reload()
  await expect(page.getByRole('button', { name: 'Line colour: Orange' })).toBeVisible()
})

test('eraser: a swipe removes every player and line it touches; undo brings them back, redo removes again', async ({ page }) => {
  const tray = await center(page, '#tray-attack')
  await touch(page, 'pointerdown', 1, ...tray)
  await touch(page, 'pointerup', 1, ...tray) // one attacker on the left half
  await swipe(page, 1, await emptyHalf(page, 0.2, 0.2), await emptyHalf(page, 0.8, 0.3))
  await swipe(page, 1, await emptyHalf(page, 0.2, 0.7), await emptyHalf(page, 0.8, 0.8))
  await expect(strokes(page)).toHaveCount(2)

  await eraserButton(page).click()
  await expect(eraserButton(page)).toHaveAttribute('aria-pressed', 'true')
  // With the eraser on, a swipe draws nothing and removes both lines it crosses...
  // The lines run across the court's width in both orientations, so cross them along its length.
  await swipe(page, 1, await emptyHalf(page, 0.5, 0.05), await emptyHalf(page, 0.5, 0.95), 24)
  await expect(strokes(page)).toHaveCount(0)
  // ...and a tap on a player removes it.
  const player = await center(page, '.board [data-token-id] polygon')
  await touch(page, 'pointerdown', 1, ...player)
  await touch(page, 'pointerup', 1, ...player)
  await expect(tokens(page)).toHaveCount(0)

  // The swipe was one step: one undo restores both lines.
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(tokens(page)).toHaveCount(1)
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(strokes(page)).toHaveCount(2)
  await page.getByRole('button', { name: 'Redo' }).click()
  await expect(strokes(page)).toHaveCount(0)
  // Keyboard shortcut too.
  await page.keyboard.press('ControlOrMeta+z')
  await expect(strokes(page)).toHaveCount(2)

  // Taking a player from a tray switches back to drawing.
  await touch(page, 'pointerdown', 1, ...tray)
  await touch(page, 'pointerup', 1, ...tray)
  await expect(eraserButton(page)).toHaveAttribute('aria-pressed', 'false')
})

test('a second finger pinches: no stray line, no player moved', async ({ page }) => {
  await page.getByRole('button', { name: 'Place 6 v 6 in standard positions' }).click()
  const player = page.locator('.board [data-token-id]').first()
  const before = await player.getAttribute('transform')
  const token = await center(page, '.board [data-token-id] rect')
  const a = await emptyHalf(page, 0.2, 0.3)
  const b = await emptyHalf(page, 0.6, 0.6)
  await touch(page, 'pointerdown', 1, ...a)
  await touch(page, 'pointermove', 1, a[0] + 10, a[1] + 10)
  // Second touch lands on a player and moves while the first is drawing.
  await touch(page, 'pointerdown', 2, ...token)
  await touch(page, 'pointermove', 2, token[0] - 120, token[1])
  await touch(page, 'pointermove', 1, ...b)
  await touch(page, 'pointerup', 2, token[0] - 120, token[1])
  await touch(page, 'pointerup', 1, ...b)
  // Positions are stored in court metres, so zoom does not change them.
  expect(await player.getAttribute('transform')).toBe(before)
  await expect(strokes(page)).toHaveCount(0)
  // A leftover finger after a pinch does not draw either: lines only start from a fresh touch.
  await swipe(page, 1, await emptyHalf(page, 0.3, 0.3), await emptyHalf(page, 0.6, 0.4))
  await expect(strokes(page)).toHaveCount(1)
})

test.describe('zoom', () => {
  const level = (page: Page) => page.locator('.zoom-level')

  test('pinching with two fingers zooms around them; the level resets to the whole court', async ({ page }) => {
    const vp = page.viewportSize()!
    const c: [number, number] = [vp.width / 2, vp.height / 2]
    await touch(page, 'pointerdown', 1, c[0] - 30, c[1])
    await touch(page, 'pointerdown', 2, c[0] + 30, c[1])
    for (let i = 1; i <= 6; i++) {
      await touch(page, 'pointermove', 1, c[0] - 30 - i * 5, c[1])
      await touch(page, 'pointermove', 2, c[0] + 30 + i * 5, c[1])
    }
    await touch(page, 'pointerup', 1, c[0] - 60, c[1])
    await touch(page, 'pointerup', 2, c[0] + 60, c[1])
    await expect(level(page)).toHaveText('200%')
    await expect(strokes(page)).toHaveCount(0)
    await level(page).click()
    await expect(level(page)).toHaveText('100%')
  })

  test('trackpad pinch (Ctrl + wheel) zooms; scrolling pans when zoomed', async ({ page }) => {
    // Mobile WebKit has no wheel to drive, so send the events a trackpad would.
    const wheel = (init: { deltaX?: number; deltaY?: number; ctrlKey?: boolean }) =>
      page.evaluate(({ deltaX = 0, deltaY = 0, ctrlKey = false }) => {
        const x = innerWidth / 2
        const y = innerHeight / 2
        const target = document.elementFromPoint(x, y) ?? document.body
        target.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, clientX: x, clientY: y, deltaX, deltaY, ctrlKey }))
      }, init)
    await wheel({ deltaY: -70, ctrlKey: true })
    await expect(level(page)).toHaveText('201%')
    const court = page.locator('.board > g > g rect').first()
    const before = (await court.boundingBox())!
    await wheel({ deltaX: 80 })
    await expect.poll(async () => (await court.boundingBox())!.x).not.toBe(before.x)
  })

  test('zoom buttons step in and out, within 100–400 %', async ({ page }) => {
    const zoomIn = page.getByRole('button', { name: 'Zoom in' })
    const zoomOut = page.getByRole('button', { name: 'Zoom out' })
    if (!(await zoomIn.isVisible())) test.skip(true, 'phones use pinch; only the level is shown')
    await expect(zoomOut).toBeDisabled()
    await zoomIn.click()
    await expect(level(page)).toHaveText('125%')
    for (let i = 0; i < 10; i++) if (await zoomIn.isEnabled()) await zoomIn.click()
    await expect(level(page)).toHaveText('400%')
    await expect(zoomIn).toBeDisabled()
    await zoomOut.click()
    await expect(level(page)).toHaveText('320%')
  })
})

test('court switch: half shows the half changed last; full brings the other half back as it was', async ({ page }) => {
  // Players on the left (6 v 6), then a line on the right: the right half changed last.
  await page.getByRole('button', { name: 'Place 6 v 6 in standard positions' }).click()
  await swipe(page, 1, await emptyHalf(page, 0.2, 0.3), await emptyHalf(page, 0.6, 0.6))

  const courtButton = courtMenuButton(page)
  await courtButton.click()
  await page.getByRole('menuitemradio', { name: /Half court/ }).click()
  await expect(page.getByRole('menuitemradio')).toHaveCount(0)
  await expect(tokens(page)).toHaveCount(0)
  await expect(strokes(page)).toHaveCount(1)

  // Clear in half view only wipes the visible half, players and lines.
  await swipe(page, 1, await emptyCourt(page, 0.2, 0.2), await emptyCourt(page, 0.4, 0.3))
  await page.locator('#tray-attack').focus()
  await page.keyboard.press('Enter')
  await expect(strokes(page)).toHaveCount(2)
  await expect(tokens(page)).toHaveCount(1)
  await clearButton(page).click()
  await expect(strokes(page)).toHaveCount(0)
  await expect(tokens(page)).toHaveCount(0)
  await swipe(page, 1, await emptyCourt(page, 0.2, 0.3), await emptyCourt(page, 0.5, 0.6))

  await courtMenuButton(page).click()
  await page.getByRole('menuitemradio', { name: /Full court/ }).click()
  await expect(tokens(page)).toHaveCount(12)
  await expect(strokes(page)).toHaveCount(1)
  // The line is back on the right half.
  const line = await strokes(page).first().boundingBox()
  const court = await page.locator('.board > g > g rect').first().boundingBox()
  const portrait = (await page.locator('.app').getAttribute('data-orientation')) === 'portrait'
  if (portrait) expect(line!.y + line!.height / 2).toBeGreaterThan(court!.y + court!.height / 2)
  else expect(line!.x + line!.width / 2).toBeGreaterThan(court!.x + court!.width / 2)
})

test('board state survives a reload', async ({ page }) => {
  await page.getByRole('button', { name: 'Place 6 v 6 in standard positions' }).click()
  await swipe(page, 1, await emptyHalf(page, 0.2, 0.2), await emptyHalf(page, 0.7, 0.6))
  await page.reload()
  await expect(tokens(page)).toHaveCount(12)
  await expect(strokes(page)).toHaveCount(1)
})

test('keyboard: place, move and delete a player; menu works with arrows and Escape', async ({ page }) => {
  await page.locator('#tray-defense').focus()
  await page.keyboard.press('Enter')
  await expect(tokens(page)).toHaveCount(1)
  await expect(page.getByRole('status')).toHaveText('Defender 1 placed')

  const token = page.getByRole('button', { name: 'Defender 1' })
  await token.focus()
  const before = await token.getAttribute('transform')
  await page.keyboard.press('ArrowLeft')
  expect(await token.getAttribute('transform')).not.toBe(before)
  await page.keyboard.press('Delete')
  await expect(tokens(page)).toHaveCount(0)
  await expect(page.locator('#tray-defense')).toBeFocused()

  const courtButton = courtMenuButton(page)
  await courtButton.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('menuitemradio', { name: /Full court/ })).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('menuitemradio', { name: /Half court/ })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(courtButton).toBeFocused()
})

test('toolbar buttons meet the 44 pt touch target and fit the screen', async ({ page }) => {
  const viewport = page.viewportSize()!
  for (const b of await page.locator('.bottom-bar button').all()) {
    const box = (await b.boundingBox())!
    expect(box.height).toBeGreaterThanOrEqual(44)
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
  }
})

test('the top row never overlaps: canvases left, zoom centre, undo / redo right', async ({ page }) => {
  for (const [width, height] of [[1194, 834], [834, 1194], [683, 1000], [390, 844], [320, 568], [844, 390]] as const) {
    await page.setViewportSize({ width, height })
    await page.waitForTimeout(50)
    const boxes = await Promise.all(['.canvas-button', '.zoom-controls', '.undo-redo'].map(async (s) => (await page.locator(s).boundingBox())!))
    const [canvas, zoom, undo] = boxes as [NonNullable<(typeof boxes)[0]>, NonNullable<(typeof boxes)[0]>, NonNullable<(typeof boxes)[0]>]
    expect(canvas.x + canvas.width, `canvases clear of zoom at ${width}x${height}`).toBeLessThanOrEqual(zoom.x)
    expect(zoom.x + zoom.width, `zoom clear of undo at ${width}x${height}`).toBeLessThanOrEqual(undo.x)
    expect(undo.x + undo.width).toBeLessThanOrEqual(width)
  }
})

test('the court is centred and toolbar buttons never overlap', async ({ page }) => {
  for (const [width, height] of [[1194, 834], [834, 1194], [683, 1000], [390, 844], [320, 568], [844, 390]] as const) {
    await page.setViewportSize({ width, height })
    await page.waitForTimeout(50)
    const court = (await page.locator('.board > g > g rect').first().boundingBox())!
    expect(Math.abs(court.x + court.width / 2 - width / 2), `court centred at ${width}x${height}`).toBeLessThan(2)
    const bar = (await page.locator('.bottom-bar').boundingBox())!
    const boxes = []
    for (const b of await page.locator('.bottom-bar button:visible').all()) boxes.push((await b.boundingBox())!)
    for (const [i, b] of boxes.entries()) {
      expect(b.x, `inside bar at ${width}x${height}`).toBeGreaterThanOrEqual(bar.x - 0.5)
      expect(b.x + b.width).toBeLessThanOrEqual(bar.x + bar.width + 0.5)
      if (i > 0) expect(b.x, `no overlap at ${width}x${height}`).toBeGreaterThanOrEqual(boxes[i - 1]!.x + boxes[i - 1]!.width - 0.5)
    }
  }
})

test.describe('canvases', () => {
  const dialog = (page: Page) => page.getByRole('dialog', { name: 'Canvases' })
  const openCanvases = (page: Page) => page.getByRole('button', { name: /^Canvases, current:/ }).click()

  test('create, rename, duplicate, switch and delete canvases', async ({ page }) => {
    await page.getByRole('button', { name: 'Place 6 v 6 in standard positions' }).click()

    // Rename the first canvas.
    await openCanvases(page)
    await expect(dialog(page)).toBeVisible()
    await dialog(page).getByRole('button', { name: 'Rename Canvas 1' }).click()
    const field = dialog(page).getByLabel('Canvas name')
    await field.fill('Base defense')
    await field.press('Enter')
    await expect(dialog(page).getByRole('button', { name: /^Open Base defense/ })).toBeVisible()

    // Duplicate it: the copy has the same twelve players.
    await dialog(page).getByRole('button', { name: 'Duplicate Base defense' }).click()
    await expect(dialog(page).getByRole('button', { name: /^Open Base defense copy\. 12 players/ })).toBeVisible()

    // A new canvas opens empty and closes the dialog. "Canvas 1" is free again after the rename.
    await dialog(page).getByRole('button', { name: 'New canvas' }).click()
    await expect(dialog(page)).toBeHidden()
    await expect(tokens(page)).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Canvases, current: Canvas 1' })).toBeVisible()

    // Switch back.
    await openCanvases(page)
    await dialog(page).getByRole('button', { name: /^Open Base defense copy/ }).click()
    await expect(tokens(page)).toHaveCount(12)

    // Delete asks first; Cancel keeps it.
    await openCanvases(page)
    await dialog(page).getByRole('button', { name: 'Delete Canvas 1' }).click()
    await dialog(page).getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog(page).getByRole('button', { name: /^Open Canvas 1/ })).toBeVisible()
    await dialog(page).getByRole('button', { name: 'Delete Canvas 1' }).click()
    await dialog(page).getByRole('button', { name: 'Delete', exact: true }).click()
    await expect(dialog(page).getByRole('button', { name: /^Open Canvas 1/ })).toHaveCount(0)
    await expect(dialog(page).getByRole('listitem')).toHaveCount(2)

    // Escape closes the dialog; everything survives a reload.
    await page.keyboard.press('Escape')
    await expect(dialog(page)).toBeHidden()
    await page.reload()
    await expect(page.getByRole('button', { name: 'Canvases, current: Base defense copy' })).toBeVisible()
    await expect(tokens(page)).toHaveCount(12)
  })

  test('the canvases button never overlaps the court', async ({ page }) => {
    const button = (await page.locator('.canvas-button').boundingBox())!
    const court = (await page.locator('.board > g > g rect').first().boundingBox())!
    const overlaps =
      button.x < court.x + court.width && button.x + button.width > court.x && button.y < court.y + court.height && button.y + button.height > court.y
    expect(overlaps).toBe(false)
  })

  test('undo history belongs to one canvas', async ({ page }) => {
    await page.getByRole('button', { name: 'Place 6 v 6 in standard positions' }).click()
    await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled()
    await openCanvases(page)
    await dialog(page).getByRole('button', { name: 'New canvas' }).click()
    await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled()
  })

  test('touch: a tap opens the dialog, a tap outside closes it and the board works again', async ({ page }) => {
    await page.locator('.canvas-button').tap()
    await expect(dialog(page)).toBeVisible()
    await expect(dialog(page)).toBeFocused()
    // The board behind is inert while the dialog is open.
    await expect(page.locator('#root')).toHaveAttribute('inert', '')
    const vp = page.viewportSize()!
    await page.locator('.canvas-overlay').tap({ position: { x: vp.width - 10, y: vp.height - 10 } })
    await expect(dialog(page)).toBeHidden()
    await expect(page.locator('#root')).not.toHaveAttribute('inert', '')
    await expect(page.locator('.canvas-button')).toBeFocused()
    await page.getByRole('button', { name: 'Place 6 v 6 in standard positions' }).tap()
    await expect(tokens(page)).toHaveCount(12)
    // Tapping a canvas row opens it.
    await page.locator('.canvas-button').tap()
    await dialog(page).getByRole('button', { name: 'New canvas' }).tap()
    await expect(tokens(page)).toHaveCount(0)
  })

  test('the last canvas cannot be deleted', async ({ page }) => {
    await openCanvases(page)
    await expect(dialog(page).getByRole('button', { name: 'Delete Canvas 1' })).toBeDisabled()
  })
})
