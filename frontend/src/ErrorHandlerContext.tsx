import {createContext} from 'react'

type ErrorHandlerContextValue = {
  onError: (err: Error) => void
  sessionId: string
  setupLogger: (extraParams?: any) => void
}
const ErrorHandlerContext = createContext<ErrorHandlerContextValue>({} as ErrorHandlerContextValue)

export default ErrorHandlerContext
