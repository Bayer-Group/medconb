export function generateFlatTree(n, ontologyId, maxChildrenPerNode, numRootNodes) {
  if (n <= 0 || numRootNodes <= 0) return []

  const tree = []
  let currentId = 1

  // Recursive function to build the tree.
  function buildTree(currentId, parentPath) {
    if (currentId > n) return currentId

    const path = [...parentPath, currentId]
    const node = {
      id: currentId,
      code: `c-${currentId}`, // Consistent code generation.
      ontology_id: ontologyId, // Static ontology ID passed as argument.
      description: `d-${currentId}`,
      path,
      children_ids: [],
      last_descendant_id: currentId, // Placeholder; will update after processing children.
    }

    tree.push(node)

    // Decide the number of children for the current node (up to maxChildrenPerNode).
    const maxChildren = Math.min(maxChildrenPerNode, n - currentId)
    let lastChildId = currentId

    if (path.length < 3) {
      for (let i = 0; i < maxChildren; i++) {
        if (lastChildId + 1 > n) break
        const childId = lastChildId + 1
        node.children_ids.push(childId)
        lastChildId = buildTree(childId, path)
      }
    }

    node.last_descendant_id = lastChildId
    return lastChildId
  }

  // Create the root nodes and their subtrees.
  for (let i = 0; i < numRootNodes; i++) {
    if (currentId > n) break
    currentId = buildTree(currentId, [])
    currentId++
  }

  return tree
}

export default [
  {
    id: 1,
    code: 'c-1',
    ontology_id: 'o',
    description: 'd-1',
    path: [1],
    children_ids: [2, 6, 10],
    last_descendant_id: 13,
  },
  {
    id: 2,
    code: 'c-2',
    ontology_id: 'o',
    description: 'd-2',
    path: [1, 2],
    children_ids: [3, 4, 5],
    last_descendant_id: 5,
  },
  {
    id: 3,
    code: 'c-3',
    ontology_id: 'o',
    description: 'd-3',
    path: [1, 2, 3],
    children_ids: [],
    last_descendant_id: 3,
  },
  {
    id: 4,
    code: 'c-4',
    ontology_id: 'o',
    description: 'd-4',
    path: [1, 2, 4],
    children_ids: [],
    last_descendant_id: 4,
  },
  {
    id: 5,
    code: 'c-5',
    ontology_id: 'o',
    description: 'd-5',
    path: [1, 2, 5],
    children_ids: [],
    last_descendant_id: 5,
  },
  {
    id: 6,
    code: 'c-6',
    ontology_id: 'o',
    description: 'd-6',
    path: [1, 6],
    children_ids: [7, 8, 9],
    last_descendant_id: 9,
  },
  {
    id: 7,
    code: 'c-7',
    ontology_id: 'o',
    description: 'd-7',
    path: [1, 6, 7],
    children_ids: [],
    last_descendant_id: 7,
  },
  {
    id: 8,
    code: 'c-8',
    ontology_id: 'o',
    description: 'd-8',
    path: [1, 6, 8],
    children_ids: [],
    last_descendant_id: 8,
  },
  {
    id: 9,
    code: 'c-9',
    ontology_id: 'o',
    description: 'd-9',
    path: [1, 6, 9],
    children_ids: [],
    last_descendant_id: 9,
  },
  {
    id: 10,
    code: 'c-10',
    ontology_id: 'o',
    description: 'd-10',
    path: [1, 10],
    children_ids: [11, 12, 13],
    last_descendant_id: 13,
  },
  {
    id: 11,
    code: 'c-11',
    ontology_id: 'o',
    description: 'd-11',
    path: [1, 10, 11],
    children_ids: [],
    last_descendant_id: 11,
  },
  {
    id: 12,
    code: 'c-12',
    ontology_id: 'o',
    description: 'd-12',
    path: [1, 10, 12],
    children_ids: [],
    last_descendant_id: 12,
  },
  {
    id: 13,
    code: 'c-13',
    ontology_id: 'o',
    description: 'd-13',
    path: [1, 10, 13],
    children_ids: [],
    last_descendant_id: 13,
  },
  {
    id: 14,
    code: 'c-14',
    ontology_id: 'o',
    description: 'd-14',
    path: [14],
    children_ids: [15, 19],
    last_descendant_id: 20,
  },
  {
    id: 15,
    code: 'c-15',
    ontology_id: 'o',
    description: 'd-15',
    path: [14, 15],
    children_ids: [16, 17, 18],
    last_descendant_id: 18,
  },
  {
    id: 16,
    code: 'c-16',
    ontology_id: 'o',
    description: 'd-16',
    path: [14, 15, 16],
    children_ids: [],
    last_descendant_id: 16,
  },
  {
    id: 17,
    code: 'c-17',
    ontology_id: 'o',
    description: 'd-17',
    path: [14, 15, 17],
    children_ids: [],
    last_descendant_id: 17,
  },
  {
    id: 18,
    code: 'c-18',
    ontology_id: 'o',
    description: 'd-18',
    path: [14, 15, 18],
    children_ids: [],
    last_descendant_id: 18,
  },
  {
    id: 19,
    code: 'c-19',
    ontology_id: 'o',
    description: 'd-19',
    path: [14, 19],
    children_ids: [20],
    last_descendant_id: 20,
  },
  {
    id: 20,
    code: 'c-20',
    ontology_id: 'o',
    description: 'd-20',
    path: [14, 19, 20],
    children_ids: [],
    last_descendant_id: 20,
  },
]
