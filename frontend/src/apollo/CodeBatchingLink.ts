import {
  ApolloLink,
  createSignalIfSupported,
  fallbackHttpConfig,
  FetchResult,
  fromError,
  gql,
  NextLink,
  Observable,
  Operation,
  parseAndCheckHttpResponse,
  selectHttpOptionsAndBody,
  serializeFetchParameter,
} from '@apollo/client'
import {createOperation} from '@apollo/client/link/utils'
import {CodeOperationBatcher} from './CodeOperationBatcher'
import {FETCH_CODE, FETCH_CODES} from '../graphql'

class CodeBatchingLink extends ApolloLink {
  private batcher: CodeOperationBatcher

  constructor() {
    super()

    const linkConfig = {
      http: {includeExtensions: false, preserveHeaderCase: false},
    }

    const batchHandler = (operations: Operation[]) => {
      const context = operations[0].getContext()

      const clientAwarenessHeaders: {
        'apollographql-client-name'?: string
        'apollographql-client-version'?: string
      } = {}
      if (context.clientAwareness) {
        const {name, version} = context.clientAwareness
        if (name) {
          clientAwarenessHeaders['apollographql-client-name'] = name
        }
        if (version) {
          clientAwarenessHeaders['apollographql-client-version'] = version
        }
      }

      const contextConfig = {
        http: context.http,
        options: context.fetchOptions,
        credentials: context.credentials,
        headers: {...clientAwarenessHeaders, ...context.headers},
      }

      const batchOperation = createOperation(context, {
        query: FETCH_CODES,
        variables: {
          codeIDs: operations.map((o) => o.variables.codeID),
        },
      })

      //uses fallback, link, and then context to build options
      const {options, body} = selectHttpOptionsAndBody(batchOperation, fallbackHttpConfig, linkConfig, contextConfig)

      try {
        ;(options as any).body = serializeFetchParameter(body, 'Payload')
      } catch (parseError) {
        return fromError<FetchResult>(parseError)
      }

      let controller: any
      if (!(options as any).signal) {
        const {controller: _controller, signal} = createSignalIfSupported()
        controller = _controller
        if (controller) (options as any).signal = signal
      }

      return new Observable<FetchResult>((observer) => {
        fetch(context.uri, options)
          .then((response) => {
            // Make the raw response available in the context.
            operations.forEach((operation) => operation.setContext({response}))
            return response
          })
          .then(parseAndCheckHttpResponse(operations))
          .then((result: any) => {
            // console.log(result)
            // we have data and can send it to back up the link chain
            observer.next(result)
            observer.complete()
            return result
          })
          .catch((err) => {
            // fetch was cancelled so its already been cleaned up in the unsubscribe
            if (err.name === 'AbortError') return
            // if it is a network error, BUT there is graphql result info
            // fire the next observer before calling error
            // this gives apollo-client (and react-apollo) the `graphqlErrors` and `networkErrors`
            // to pass to UI
            // this should only happen if we *also* have data as part of the response key per
            // the spec
            if (err.result && err.result.errors && err.result.data) {
              // if we dont' call next, the UI can only show networkError because AC didn't
              // get andy graphqlErrors
              // this is graphql execution result info (i.e errors and possibly data)
              // this is because there is no formal spec how errors should translate to
              // http status codes. So an auth error (401) could have both data
              // from a public field, errors from a private field, and a status of 401
              // {
              //  user { // this will have errors
              //    firstName
              //  }
              //  products { // this is public so will have data
              //    cost
              //  }
              // }
              //
              // the result of above *could* look like this:
              // {
              //   data: { products: [{ cost: "$10" }] },
              //   errors: [{
              //      message: 'your session has timed out',
              //      path: []
              //   }]
              // }
              // status code of above would be a 401
              // in the UI you want to show data where you can, errors as data where you can
              // and use correct http status codes
              observer.next(err.result)
            }

            observer.error(err)
          })

        return () => {
          // XXX support canceling this request
          // https://developers.google.com/web/updates/2017/09/abortable-fetch
          if (controller) controller.abort()
        }
      })
    }

    this.batcher = new CodeOperationBatcher({
      batchHandler,
      batchMax: 200,
    })
  }

  request(
    operation: Operation,
    forward?: NextLink | undefined,
  ): Observable<FetchResult<Record<string, any>, Record<string, any>, Record<string, any>>> | null {
    if (forward && operation.operationName !== 'getCode') {
      return forward(operation)
    }

    if (forward && operation.variables.startCursor !== undefined) {
      return forward(operation)
    }

    if (!operation.variables.codeID) return null

    const {cache} = operation.getContext()

    const codeRecord = cache.readFragment({
      id: `Code:${operation.variables.codeID}`,
      fragment: gql`
        fragment TCode on Code {
          id
          code
          description
          numberOfChildren
          lastDescendantId
          path {
            id
          }
          children {
            id
            code
            description
            numberOfChildren
            lastDescendantId
            path {
              id
            }
          }
        }
      `,
    })

    if (forward && codeRecord && codeRecord.code) {
      console.log(`Code ${operation.variables.codeID} already in cache`)
      return forward(operation)
    }

    // return null
    return this.batcher.enqueueRequest({operation})
  }
}

export default CodeBatchingLink
