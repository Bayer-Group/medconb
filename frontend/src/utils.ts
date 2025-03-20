import {Observable} from '@apollo/client'
import {ContainerSpec} from '..'
import {BreadCrumbItem} from './components/BreadCrumbs'
import {geekblue, cyan, gold, green, volcano} from '@ant-design/colors'

export const colors = [volcano.at(5), geekblue.at(4), cyan.at(4), gold.at(6), green.at(4)] as string[]
// export const colors = [geekblue.at(4), cyan.at(4), gold.at(6), green.at(4), volcano.at(5)] as string[]
const containerHierarchyToBreadcrumbItems = (
  entityType: string,
  containerHierarchy: ContainerSpec[] = [],
): BreadCrumbItem[] => {
  return containerHierarchy.map((item: ContainerSpec, i: number, a: ContainerSpec[]) => {
    if (item.type === 'Collection') {
      if (entityType === 'Codelist' && a.length == 1) {
        return {
          id: item.id,
          type: 'CodelistCollection',
          name: item.name,
        }
      } else {
        return {
          id: item.id,
          type: 'PhenotypeCollection',
          name: item.name,
        }
      }
    } else {
      return {
        id: item.id,
        type: item.type,
        name: item.name,
      }
    }
  })
}

// taken from https://github.com/zenparsing/zen-observable/blob/8406a7e3a3a3faa080ec228b9a743f48021fba8b/src/extras.js#L29
const combineLatest = <T>(...sources): Observable<T> => {
  return new Observable((observer) => {
    if (sources.length === 0) return Observable.from([])
    let count = sources.length
    let seen = new Set()
    let seenAll = false
    const values = sources.map(() => undefined)

    const subscriptions = sources.map((source, index) =>
      Observable.from(source).subscribe({
        next(v) {
          values[index] = v

          if (!seenAll) {
            seen.add(index)
            if (seen.size !== sources.length) return

            seen = null
            seenAll = true
          }

          observer.next(Array.from(values))
        },
        error(e) {
          observer.error(e)
        },
        complete() {
          if (--count === 0) observer.complete()
        },
      }),
    )

    return () => subscriptions.forEach((s) => s.unsubscribe())
  })
}

export {containerHierarchyToBreadcrumbItems, combineLatest}
