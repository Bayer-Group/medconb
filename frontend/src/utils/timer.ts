export interface Timer {
  logStep: (step: string) => void
  logTotal: (close?: boolean) => void
  done: boolean
  createSubTimer: (name: string) => Timer
  getElapsedTime: () => number
  getGlobalElapsedTime: () => number
  getName: () => string
}

// Global timer registry
const timerRegistry = new Map<string, Timer>()

export const createTimer = (name: string, parent?: Timer): Timer => {
  const startTime = performance.now()
  const rootStartTime = parent ? startTime - parent.getGlobalElapsedTime() : startTime
  const fullName = parent ? `${parent.getName()}.${name}` : name
  let lastStepTime = startTime
  let timerInstance: Timer

  timerInstance = {
    logStep: (step: string) => {
      const now = performance.now()
      const elapsed = Math.round(now - startTime)
      const stepDuration = Math.round(now - lastStepTime)

      if (parent) {
        const globalElapsed = Math.round(now - rootStartTime)
        console.log(`[${fullName}] ${elapsed}ms (+${stepDuration}ms) - ${globalElapsed}ms - ${step}`)
      } else {
        console.log(`[${fullName}] ${elapsed}ms (+${stepDuration}ms) - ${step}`)
      }

      lastStepTime = now
    },
    done: false,
    logTotal: (close = false) => {
      if (!timerInstance.done) timerInstance.logStep('Total time')
      if (close) timerInstance.done = true
    },
    createSubTimer: (subName: string) => {
      return createTimer(subName, timerInstance)
    },
    getElapsedTime: () => {
      return Math.round(performance.now() - startTime)
    },
    getGlobalElapsedTime: () => {
      return Math.round(performance.now() - rootStartTime)
    },
    getName: () => fullName,
  }

  timerRegistry.set(fullName, timerInstance)

  return timerInstance
}

/**
 * Get a timer by its name/prefix
 */
export const getTimer = (name: string): Timer => {
  const timer = timerRegistry.get(name)
  return timer ? timer : createTimer(name)
}

/**
 * Get all registered timer names
 */
export const getTimerNames = (): string[] => {
  return Array.from(timerRegistry.keys())
}

/**
 * Clear all timers from the registry
 */
export const clearTimers = (): void => {
  timerRegistry.clear()
}
