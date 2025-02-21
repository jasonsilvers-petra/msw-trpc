import { test as testBase } from 'vitest'
import { setupWorker } from 'msw/browser'
import type { SetupWorker } from 'msw/browser'

const worker = setupWorker()

export const test = testBase.extend<{ worker: SetupWorker }>({
  worker: [
    async ({}, use) => {
      await worker.start({
        quiet: process.env.CI === 'true',
        onUnhandledRequest: 'error',
      })
      await use(worker)
      worker.stop()
    },
    {
      auto: true,
    },
  ],
})
