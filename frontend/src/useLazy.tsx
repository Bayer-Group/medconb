import React from 'react'

function useLazy(name: string, callToImport: any) {
  const lazyComponentsStore = React.useRef({} as any).current
  if (!lazyComponentsStore[name]) {
    lazyComponentsStore[name] = React.lazy(callToImport)
  }
  return lazyComponentsStore[name]
}

export default useLazy
