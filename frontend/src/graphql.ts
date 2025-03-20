import {gql} from '@apollo/client'

// exporting enum from index.d.ts throws wiered error
// https://stackoverflow.com/questions/63701326/exporting-enum-in-d-ts-leads-to-cant-resolve-error
export enum PropertyClass {
  Phenotype = 'Phenotype',
  Collection = 'Collection',
}

export const SELF = gql`
  query self {
    self {
      id
      externalId
      name
      tutorialState
      workspace {
        collections {
          id
          name
          itemType
          ownerID
          referenceID
          visibility
          sharedWith
          items {
            __typename
            ... on Codelist {
              id
              name
              referenceID
            }
            ... on Phenotype {
              id
              name
              ownerID
            }
          }
        }
        shared {
          id
          name
          itemType
          ownerID
          sharedWith
          items {
            __typename
            ... on Codelist {
              id
              name
              referenceID
            }
            ... on Phenotype {
              id
              name
              ownerID
            }
          }
        }
      }
    }
  }
`

export const SEARCH_ENTITIES = gql`
  query searchEntities($entityType: SearchableEntity!, $query: String!, $pageSize: Int, $startCursor: ID) {
    searchEntities(entityType: $entityType, query: $query, pageSize: $pageSize, startCursor: $startCursor) {
      items {
        __typename
        ... on Collection {
          id
          name
          description
          ownerID
          visibility
          itemType
          properties {
            propertyID
            name
            value
          }
        }
        ... on Codelist {
          id
          name
          description
          ownerID
          containerHierarchy {
            id
            type
            name
            visibility
          }
        }
        ... on Phenotype {
          id
          name
          ownerID
          medicalDescription
          operationalDescription
          properties {
            propertyID
            name
            value
          }
          containerHierarchy {
            id
            type
            name
            visibility
          }
        }
      }
      total
    }
  }
`

export const USERS = gql`
  query users($ids: [ID!]) {
    users(ids: $ids) {
      id
      externalId
      name
    }
  }
`

export const CREATE_COLLECTION = gql`
  mutation createCollection($name: String!, $type: ItemType!) {
    createCollection(name: $name, itemType: $type) {
      id
      name
    }
  }
`

export const CREATE_CODE_LIST = gql`
  mutation createCodelist($name: String!, $position: ReferencePosition!) {
    createCodelist(name: $name, position: $position) {
      id
      name
    }
  }
`

export const CREATE_PHENOTYPE = gql`
  mutation createPhenotype($name: String!, $position: ReferencePosition!) {
    createPhenotype(name: $name, position: $position) {
      id
      name
    }
  }
`

export const MOVE_COLLECTION = gql`
  mutation moveCollection($collectionID: ID!, $refCollectionID: ID) {
    moveCollection(collectionID: $collectionID, refCollectionID: $refCollectionID)
  }
`
//moveCollection(collectionID: ID!, refcollectionID: ID): Boolean

export const DELETE_COLLECTION = gql`
  mutation deleteCollection($collectionID: ID!) {
    deleteCollection(collectionID: $collectionID)
  }
`

export const MOVE_CODE_LIST = gql`
  mutation moveCodelist($codelistID: ID!, $position: ReferencePosition!) {
    moveCodelist(codelistID: $codelistID, position: $position)
  }
`

export const UPDATE_CODE_LIST = gql`
  mutation updateCodelist($codelistID: ID!, $name: String, $description: String) {
    updateCodelist(codelistID: $codelistID, name: $name, description: $description) {
      id
      name
      description
      containerHierarchy {
        id
        type
        name
        visibility
      }
    }
  }
`

export const DELETE_CODE_LIST = gql`
  mutation deleteCodelist($codelistID: ID!) {
    deleteCodelist(codelistID: $codelistID)
  }
`

export const DELETE_PHENOTYPE = gql`
  mutation deletePhenotype($phenotypeID: ID!) {
    deletePhenotype(phenotypeID: $phenotypeID)
  }
`

export const CLONE_PHENOTYPE = gql`
  mutation clonePhenotype($phenotypeID: ID!, $position: ReferencePosition) {
    clonePhenotype(phenotypeID: $phenotypeID, position: $position) {
      id
    }
  }
`

const CODE_LIST_FIELDS = gql`
  fragment CodelistFields on Codelist {
    id
    name
    description
    ownerID
    containerHierarchy {
      id
      type
      name
      visibility
    }
    transientCodesets {
      ontology {
        name
      }
      codes {
        id
      }
    }
    codesets {
      ontology {
        name
      }
      codes {
        id
      }
    }
  }
`

export const FETCH_CODE_LIST = gql`
  ${CODE_LIST_FIELDS}
  query codelist($codelistID: ID!) {
    codelist(codelistID: $codelistID) {
      ...CodelistFields
    }
  }
`

export const CLONE_CODE_LIST = gql`
  ${CODE_LIST_FIELDS}
  mutation cloneCodelist($codelistID: ID!, $position: ReferencePosition) {
    cloneCodelist(codelistID: $codelistID, position: $position) {
      ...CodelistFields
    }
  }
`

export const FETCH_CODE_LIST_CHANGE_SET = gql`
  query codelist($codelistID: ID!) {
    codelist(codelistID: $codelistID) {
      id
      name
      commits {
        author {
          id
          externalId
          name
        }
        createdAt
        message
        changesets {
          ontology {
            name
          }
          added {
            id
          }
          removed {
            id
          }
        }
      }
    }
  }
`

const COLLECTION_FIELDS = gql`
  fragment ColectionFields on Collection {
    id
    name
    itemType
    description
    sharedWith
    ownerID
    referenceID
    visibility
    properties {
      propertyID
      name
      value
    }
    items {
      __typename
      ... on Codelist {
        id
        name
        ownerID
        referenceID
        codesets {
          ontology {
            name
          }
          codes {
            id
          }
        }
        containerHierarchy {
          id
          type
          name
          visibility
        }
      }
      ... on Phenotype {
        id
        name
        ownerID
        referenceID
        properties {
          propertyID
          name
          value
        }
        codelists {
          name
        }
        containerHierarchy {
          id
          type
          name
          visibility
        }
      }
    }
  }
`

export const FETCH_COLLECTION = gql`
  ${COLLECTION_FIELDS}
  query getCollection($collectionID: ID!) {
    collection(id: $collectionID) {
      ...ColectionFields
    }
  }
`

export const UPDATE_COLLECTION = gql`
  ${COLLECTION_FIELDS}
  mutation updateCollection(
    $collectionID: ID!
    $name: String
    $description: String
    $properties: [PropertyValueInput!]
    $referenceID: ID
    $ownerID: ID
    $locked: Boolean
  ) {
    updateCollection(
      collectionID: $collectionID
      name: $name
      description: $description
      properties: $properties
      referenceID: $referenceID
      ownerID: $ownerID
      locked: $locked
    ) {
      ...ColectionFields
    }
  }
`

export const ONTOLOGIES = gql`
  query getOntologies {
    ontologies {
      name
      rootCodes {
        id
      }
    }
  }
`

/*
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
 */

export const FETCH_ONTOLOGY = gql`
  query fetchOntology($name: String!, $pageSize: Int, $startCursor: ID) {
    ontology(name: $name) {
      name
      rootCodes(pageSize: $pageSize, startCursor: $startCursor) {
        id
      }
    }
  }
`

export const FETCH_CODE = gql`
  query getCode($codeID: ID!, $startCursor: ID) {
    code(id: $codeID) {
      id
      code
      description
      numberOfChildren
      lastDescendantId
      path {
        id
      }
      children(startCursor: $startCursor) {
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
  }
`

export const FETCH_CODES = gql`
  query getCodes($codeIDs: [ID!]!) {
    codes(ids: $codeIDs) {
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
  }
`

export const FETCH_CODES_WO_CHILDREN = gql`
  query getCodes($codeIDs: [ID!]!) {
    codes(ids: $codeIDs) {
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
`

export const SEARCH_CODES = gql`
  query searchCodes($ontologyID: ID!, $query: QueryData) {
    searchCodes(ontologyID: $ontologyID, query: $query) {
      id
      path {
        id
      }
    }
  }
`

export const STORE_TRANSIENT_CHANGES = gql`
  ${CODE_LIST_FIELDS}
  mutation storeTransientChanges($codelistID: ID!, $changes: [ChangesetInput!]!) {
    storeTransientChanges(codelistID: $codelistID, changes: $changes) {
      ...CodelistFields
    }
  }
`

export const DISCARD_TRANSIENT_CHANGES = gql`
  ${CODE_LIST_FIELDS}
  mutation discardTransientChanges($codelistID: ID!) {
    discardTransientChanges(codelistID: $codelistID) {
      ...CodelistFields
    }
  }
`

export const COMMIT_CODELIST_CHANGES = gql`
  ${CODE_LIST_FIELDS}
  mutation commitChanges($codelistID: ID!, $commit: CommitInput!) {
    commitChanges(codelistID: $codelistID, commit: $commit) {
      ...CodelistFields
    }
  }
`

export const IMPORT_CODE_LIST = gql`
  mutation importCodelists($containerID: ID!, $codelists: [CodelistInput!]!, $filename: String!) {
    importCodelists(containerID: $containerID, codelists: $codelists, filename: $filename) {
      stats {
        fully
        partially
        skipped
      }
      reports {
        codelistName
        skipped
        partial
        report
      }
    }
  }
`

export const SHARE_COLLECTION = gql`
  mutation setCollectionPermissions($collectionID: ID!, $readerIds: [ID!]!) {
    setCollectionPermissions(collectionID: $collectionID, readerIds: $readerIds)
  }
`

const PHENOTYPE_FIELDS = gql`
  fragment PhenotypeFields on Phenotype {
    id
    name
    medicalDescription
    operationalDescription
    referenceID
    ownerID
    properties {
      propertyID
      name
      value
    }
    containerHierarchy {
      type
      id
      name
      visibility
    }
    codelists {
      id
      name
      ownerID
      codesets {
        ontology {
          name
        }
        codes {
          id
        }
      }
    }
  }
`

export const FETCH_PHENOTYPE = gql`
  ${PHENOTYPE_FIELDS}
  query fetchPhenotype($phenotypeID: ID!) {
    phenotype(phenotypeID: $phenotypeID) {
      ...PhenotypeFields
    }
  }
`

export const UPDATE_PHENOTYPE = gql`
  ${PHENOTYPE_FIELDS}
  mutation updatePhenotype(
    $phenotypeID: ID!
    $name: String
    $position: ReferencePosition
    $medicalDescription: String
    $operationalDescription: String
    $properties: [PropertyValueInput!]
  ) {
    updatePhenotype(
      phenotypeID: $phenotypeID
      name: $name
      position: $position
      medicalDescription: $medicalDescription
      operationalDescription: $operationalDescription
      properties: $properties
    ) {
      ...PhenotypeFields
    }
  }
`

export const FETCH_PROPERTIES_DEF = gql`
  query getProperties($clazz: PropertyClass) {
    properties(clazz: $clazz) {
      id
      name
      class
      dtype
      required
      readOnly
      options
    }
  }
`

export const UPDATE_PROFILE = gql`
  mutation updateMe($tutorialState: String) {
    updateMe(tutorialState: $tutorialState) {
      tutorialState
    }
  }
`

export const CODE_PATH_FRAGMENT = gql`
  fragment PartialCode on Code {
    path {
      id
    }
  }
`
