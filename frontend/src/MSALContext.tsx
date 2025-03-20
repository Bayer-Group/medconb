import {createContext} from 'react'

type MSALContextValue = {auth: any; scopes: string[]}
const MSALContext = createContext<MSALContextValue>({} as MSALContextValue)

export default MSALContext
