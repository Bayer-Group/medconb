export interface Timer {
  logStep: (step: string) => void
  logTotal: () => void
}

export const createTimer = (prefix: string): Timer => {
  const startTime = performance.now()
  let lastStepTime = startTime

  return {
    logStep: (step: string) => {
      const now = performance.now()
      const elapsed = Math.round(now - startTime)
      const stepDuration = Math.round(now - lastStepTime)
      console.log(`[${prefix}] ${step} - ${elapsed}ms (+${stepDuration}ms)`)
      lastStepTime = now
    },
    logTotal: () => {
      const total = Math.round(performance.now() - startTime)
      console.log(`[${prefix}] Total time: ${total}ms`)
    },
  }
}
