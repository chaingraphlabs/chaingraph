import { createEffect, sample } from 'effector'
import { fetchCategorizedNodesFx } from './effects'
import { setCategorizedNodes } from './events'

// Handle fetch results
sample({
  clock: fetchCategorizedNodesFx.doneData,
  target: [
    setCategorizedNodes,
    // Metadata will be updated automatically through store handlers
  ],
})

export const initializeCategoriesFx = createEffect(async () => {
  return await fetchCategorizedNodesFx()
})

sample({
  clock: initializeCategoriesFx,
  target: fetchCategorizedNodesFx,
})
