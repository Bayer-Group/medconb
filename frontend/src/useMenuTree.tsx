import {NodeModel} from '@minoru/react-dnd-treeview'
import {useMemo} from 'react'
import {Collection} from '..'
import {MenuData} from './components/MenuTree'

const useMenuTree = (collections: Collection[]) => {
  const menuTree: NodeModel<MenuData>[] = useMemo(() => {
    const tree: NodeModel<MenuData>[] = []

    const countMC = (children: any[]) => {
      let value = children.length

      children.forEach((el) => {
        if ((el.children ?? []).length > 0) {
          value = value + countMC(el.children)
        }
      })
      return value
    }

    const processCollection = (node: Collection, parent: string | number) => {
      tree.push({
        id: node.id,
        parent,
        droppable: true,
        text: node.name,
        data: {
          type: 'collection',
          id: node.id,
          node,
          level: 0,
          numItems: countMC(node.items),
          visibility: node.visibility,
        },
      })

      if (node.items.length > 0) {
        node.items.forEach((concept: any) =>
          processItem(
            concept,
            node.id,
            node.id,
            node.itemType === 'Phenotype' ? 'phenotype' : 'codelist',
            node.visibility,
          ),
        )
      }
    }

    const processItem = (
      node: Collection['items'][number],
      parent: string,
      collectionID: string,
      type: MenuData['type'],
      visibility: 'Public' | 'Private' | 'Shared',
      level = 0,
      path: string[] = [],
    ) => {
      tree.push({
        id: node.id,
        parent,
        droppable: false, //level < 5 // todo: disable composite MC temporarily, //parent.split('-')[0] === 'coll', //children.length > 0,
        text: node.name,
        data: {
          id: node.id,
          collectionID,
          node,
          level,
          type,
          path,
          numItems: 0,
          visibility,
        },
      })
    }

    collections.forEach((collection) => processCollection(collection, 0))

    return tree
  }, [collections])

  return menuTree
}

export default useMenuTree
