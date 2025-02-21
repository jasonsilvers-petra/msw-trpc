import { test as testBase } from 'vitest'
import { setupWorker } from 'msw/browser'
import type { SetupWorker } from 'msw/browser'

const worker = setupWorker()

export const test = testBase.extend<{ worker: SetupWorker }>({
  worker: [
    async ({}, use) => {
      await worker.start({
        onUnhandledRequest(req, print) {
          if (req.url.includes('/src/') || req.url.includes('/node_modules/')) {
            return
          }
          
          print.error()
        },
      })
      await use(worker)
      worker.stop()
    },
    {
      auto: true,
    },
  ],
})
