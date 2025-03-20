declare module '*.jpg'
declare module '*.png'
declare module '*.svg'
declare module 'react-split-pane/lib/Pane'
declare let GRAPHQL_ENDPOINT: string
declare let COMMIT_HASH: string
declare module '*.md'
declare module '*.yaml'
declare module '*.yml'
interface ReadableStream<R = any> {
  [Symbol.asyncIterator](): AsyncIterableIterator<R>
}
