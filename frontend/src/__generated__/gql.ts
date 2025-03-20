/* eslint-disable */
import * as types from './graphql'
import {TypedDocumentNode as DocumentNode} from '@graphql-typed-document-node/core'

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
  '\n  query self {\n    self {\n      id\n      externalId\n      name\n      tutorialState\n      workspace {\n        collections {\n          id\n          name\n          itemType\n          ownerID\n          referenceID\n          visibility\n          sharedWith\n          items {\n            __typename\n            ... on Codelist {\n              id\n              name\n              referenceID\n            }\n            ... on Phenotype {\n              id\n              name\n              ownerID\n            }\n          }\n        }\n        shared {\n          id\n          name\n          itemType\n          ownerID\n          sharedWith\n          items {\n            __typename\n            ... on Codelist {\n              id\n              name\n              referenceID\n            }\n            ... on Phenotype {\n              id\n              name\n              ownerID\n            }\n          }\n        }\n      }\n    }\n  }\n':
    types.SelfDocument,
  '\n  query searchEntities($entityType: SearchableEntity!, $query: String!, $pageSize: Int, $startCursor: ID) {\n    searchEntities(entityType: $entityType, query: $query, pageSize: $pageSize, startCursor: $startCursor) {\n      items {\n        __typename\n        ... on Collection {\n          id\n          name\n          description\n          ownerID\n          visibility\n          itemType\n          properties {\n            propertyID\n            name\n            value\n          }\n        }\n        ... on Codelist {\n          id\n          name\n          description\n          ownerID\n          containerHierarchy {\n            id\n            type\n            name\n            visibility\n          }\n        }\n        ... on Phenotype {\n          id\n          name\n          ownerID\n          medicalDescription\n          operationalDescription\n          properties {\n            propertyID\n            name\n            value\n          }\n          containerHierarchy {\n            id\n            type\n            name\n            visibility\n          }\n        }\n      }\n      total\n    }\n  }\n':
    types.SearchEntitiesDocument,
  '\n  query users($ids: [ID!]) {\n    users(ids: $ids) {\n      id\n      externalId\n      name\n    }\n  }\n':
    types.UsersDocument,
  '\n  mutation createCollection($name: String!, $type: ItemType!) {\n    createCollection(name: $name, itemType: $type) {\n      id\n      name\n    }\n  }\n':
    types.CreateCollectionDocument,
  '\n  mutation createCodelist($name: String!, $position: ReferencePosition!) {\n    createCodelist(name: $name, position: $position) {\n      id\n      name\n    }\n  }\n':
    types.CreateCodelistDocument,
  '\n  mutation createPhenotype($name: String!, $position: ReferencePosition!) {\n    createPhenotype(name: $name, position: $position) {\n      id\n      name\n    }\n  }\n':
    types.CreatePhenotypeDocument,
  '\n  mutation moveCollection($collectionID: ID!, $refCollectionID: ID) {\n    moveCollection(collectionID: $collectionID, refCollectionID: $refCollectionID)\n  }\n':
    types.MoveCollectionDocument,
  '\n  mutation deleteCollection($collectionID: ID!) {\n    deleteCollection(collectionID: $collectionID)\n  }\n':
    types.DeleteCollectionDocument,
  '\n  mutation moveCodelist($codelistID: ID!, $position: ReferencePosition!) {\n    moveCodelist(codelistID: $codelistID, position: $position)\n  }\n':
    types.MoveCodelistDocument,
  '\n  mutation updateCodelist($codelistID: ID!, $name: String, $description: String) {\n    updateCodelist(codelistID: $codelistID, name: $name, description: $description) {\n      id\n      name\n      description\n      containerHierarchy {\n        id\n        type\n        name\n        visibility\n      }\n    }\n  }\n':
    types.UpdateCodelistDocument,
  '\n  mutation deleteCodelist($codelistID: ID!) {\n    deleteCodelist(codelistID: $codelistID)\n  }\n':
    types.DeleteCodelistDocument,
  '\n  mutation deletePhenotype($phenotypeID: ID!) {\n    deletePhenotype(phenotypeID: $phenotypeID)\n  }\n':
    types.DeletePhenotypeDocument,
  '\n  mutation clonePhenotype($phenotypeID: ID!, $position: ReferencePosition) {\n    clonePhenotype(phenotypeID: $phenotypeID, position: $position) {\n      id\n    }\n  }\n':
    types.ClonePhenotypeDocument,
  '\n  fragment CodelistFields on Codelist {\n    id\n    name\n    description\n    ownerID\n    containerHierarchy {\n      id\n      type\n      name\n      visibility\n    }\n    transientCodesets {\n      ontology {\n        name\n      }\n      codes {\n        id\n      }\n    }\n    codesets {\n      ontology {\n        name\n      }\n      codes {\n        id\n      }\n    }\n  }\n':
    types.CodelistFieldsFragmentDoc,
  '\n  \n  query codelist($codelistID: ID!) {\n    codelist(codelistID: $codelistID) {\n      ...CodelistFields\n    }\n  }\n':
    types.CodelistDocument,
  '\n  \n  mutation cloneCodelist($codelistID: ID!, $position: ReferencePosition) {\n    cloneCodelist(codelistID: $codelistID, position: $position) {\n      ...CodelistFields\n    }\n  }\n':
    types.CloneCodelistDocument,
  '\n  query codelistChangeset($codelistID: ID!) {\n    codelist(codelistID: $codelistID) {\n      id\n      name\n      commits {\n        author {\n          id\n          externalId\n          name\n        }\n        createdAt\n        message\n        changesets {\n          ontology {\n            name\n          }\n          added {\n            id\n            code\n            description\n          }\n          removed {\n            id\n            code\n            description\n          }\n        }\n      }\n    }\n  }\n':
    types.CodelistChangesetDocument,
  '\n  fragment ColectionFields on Collection {\n    id\n    name\n    itemType\n    description\n    sharedWith\n    ownerID\n    referenceID\n    visibility\n    properties {\n      propertyID\n      name\n      value\n    }\n    items {\n      __typename\n      ... on Codelist {\n        id\n        name\n        ownerID\n        referenceID\n        codesets {\n          ontology {\n            name\n          }\n          codes {\n            id\n          }\n        }\n        containerHierarchy {\n          id\n          type\n          name\n          visibility\n        }\n      }\n      ... on Phenotype {\n        id\n        name\n        ownerID\n        referenceID\n        properties {\n          propertyID\n          name\n          value\n        }\n        codelists {\n          name\n        }\n        containerHierarchy {\n          id\n          type\n          name\n          visibility\n        }\n      }\n    }\n  }\n':
    types.ColectionFieldsFragmentDoc,
  '\n  \n  query getCollection($collectionID: ID!) {\n    collection(id: $collectionID) {\n      ...ColectionFields\n    }\n  }\n':
    types.GetCollectionDocument,
  '\n  \n  mutation updateCollection(\n    $collectionID: ID!\n    $name: String\n    $description: String\n    $properties: [PropertyValueInput!]\n    $referenceID: ID\n    $ownerID: ID\n    $locked: Boolean\n  ) {\n    updateCollection(\n      collectionID: $collectionID\n      name: $name\n      description: $description\n      properties: $properties\n      referenceID: $referenceID\n      ownerID: $ownerID\n      locked: $locked\n    ) {\n      ...ColectionFields\n    }\n  }\n':
    types.UpdateCollectionDocument,
  '\n  query getOntologies {\n    ontologies {\n      name\n      rootCodes {\n        id\n        code\n        description\n        numberOfChildren\n        lastDescendantId\n      }\n    }\n  }\n':
    types.GetOntologiesDocument,
  '\n  query fetchOntology($name: String!, $startCursor: ID) {\n    ontology(name: $name) {\n      name\n      rootCodes(startCursor: $startCursor) {\n        id\n        code\n        description\n        numberOfChildren\n        lastDescendantId\n        path {\n          id\n        }\n        children {\n          id\n          code\n          description\n          numberOfChildren\n          lastDescendantId\n          path {\n            id\n          }\n        }\n      }\n    }\n  }\n':
    types.FetchOntologyDocument,
  '\n  query getCode($codeID: ID!, $startCursor: ID) {\n    code(id: $codeID) {\n      id\n      code\n      description\n      numberOfChildren\n      lastDescendantId\n      path {\n        id\n      }\n      children(startCursor: $startCursor) {\n        id\n        code\n        description\n        numberOfChildren\n        lastDescendantId\n        path {\n          id\n        }\n      }\n    }\n  }\n':
    types.GetCodeDocument,
  '\n  query getCodes($codeIDs: [ID!]!) {\n    codes(ids: $codeIDs) {\n      id\n      code\n      description\n      numberOfChildren\n      lastDescendantId\n      path {\n        id\n      }\n      children {\n        id\n        code\n        description\n        numberOfChildren\n        lastDescendantId\n        path {\n          id\n        }\n      }\n    }\n  }\n':
    types.GetCodesDocument,
  '\n  query searchCodes($ontologyID: ID!, $query: QueryData) {\n    searchCodes(ontologyID: $ontologyID, query: $query) {\n      id\n      code\n      description\n      numberOfChildren\n      lastDescendantId\n      path {\n        id\n      }\n      children {\n        id\n        code\n        description\n        numberOfChildren\n        lastDescendantId\n        path {\n          id\n        }\n      }\n    }\n  }\n':
    types.SearchCodesDocument,
  '\n  \n  mutation storeTransientChanges($codelistID: ID!, $changes: [ChangesetInput!]!) {\n    storeTransientChanges(codelistID: $codelistID, changes: $changes) {\n      ...CodelistFields\n    }\n  }\n':
    types.StoreTransientChangesDocument,
  '\n  \n  mutation discardTransientChanges($codelistID: ID!) {\n    discardTransientChanges(codelistID: $codelistID) {\n      ...CodelistFields\n    }\n  }\n':
    types.DiscardTransientChangesDocument,
  '\n  \n  mutation commitChanges($codelistID: ID!, $commit: CommitInput!) {\n    commitChanges(codelistID: $codelistID, commit: $commit) {\n      ...CodelistFields\n    }\n  }\n':
    types.CommitChangesDocument,
  '\n  mutation importCodelists($containerID: ID!, $codelists: [CodelistInput!]!, $filename: String!) {\n    importCodelists(containerID: $containerID, codelists: $codelists, filename: $filename) {\n      stats {\n        fully\n        partially\n        skipped\n      }\n      reports {\n        codelistName\n        skipped\n        partial\n        report\n      }\n    }\n  }\n':
    types.ImportCodelistsDocument,
  '\n  mutation setCollectionPermissions($collectionID: ID!, $readerIds: [ID!]!) {\n    setCollectionPermissions(collectionID: $collectionID, readerIds: $readerIds)\n  }\n':
    types.SetCollectionPermissionsDocument,
  '\n  fragment PhenotypeFields on Phenotype {\n    id\n    name\n    medicalDescription\n    operationalDescription\n    referenceID\n    ownerID\n    properties {\n      propertyID\n      name\n      value\n    }\n    containerHierarchy {\n      type\n      id\n      name\n      visibility\n    }\n    codelists {\n      id\n      name\n      ownerID\n      codesets {\n        ontology {\n          name\n        }\n        codes {\n          id\n        }\n      }\n    }\n  }\n':
    types.PhenotypeFieldsFragmentDoc,
  '\n  \n  query fetchPhenotype($phenotypeID: ID!) {\n    phenotype(phenotypeID: $phenotypeID) {\n      ...PhenotypeFields\n    }\n  }\n':
    types.FetchPhenotypeDocument,
  '\n  \n  mutation updatePhenotype(\n    $phenotypeID: ID!\n    $name: String\n    $position: ReferencePosition\n    $medicalDescription: String\n    $operationalDescription: String\n    $properties: [PropertyValueInput!]\n  ) {\n    updatePhenotype(\n      phenotypeID: $phenotypeID\n      name: $name\n      position: $position\n      medicalDescription: $medicalDescription\n      operationalDescription: $operationalDescription\n      properties: $properties\n    ) {\n      ...PhenotypeFields\n    }\n  }\n':
    types.UpdatePhenotypeDocument,
  '\n  query getProperties($clazz: PropertyClass) {\n    properties(clazz: $clazz) {\n      id\n      name\n      class\n      dtype\n      required\n      readOnly\n      options\n    }\n  }\n':
    types.GetPropertiesDocument,
  '\n  mutation updateMe($tutorialState: String) {\n    updateMe(tutorialState: $tutorialState) {\n      tutorialState\n    }\n  }\n':
    types.UpdateMeDocument,
  '\n  fragment PartialCode on Code {\n    path {\n      id\n    }\n  }\n': types.PartialCodeFragmentDoc,
}

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query self {\n    self {\n      id\n      externalId\n      name\n      tutorialState\n      workspace {\n        collections {\n          id\n          name\n          itemType\n          ownerID\n          referenceID\n          visibility\n          sharedWith\n          items {\n            __typename\n            ... on Codelist {\n              id\n              name\n              referenceID\n            }\n            ... on Phenotype {\n              id\n              name\n              ownerID\n            }\n          }\n        }\n        shared {\n          id\n          name\n          itemType\n          ownerID\n          sharedWith\n          items {\n            __typename\n            ... on Codelist {\n              id\n              name\n              referenceID\n            }\n            ... on Phenotype {\n              id\n              name\n              ownerID\n            }\n          }\n        }\n      }\n    }\n  }\n',
): typeof documents['\n  query self {\n    self {\n      id\n      externalId\n      name\n      tutorialState\n      workspace {\n        collections {\n          id\n          name\n          itemType\n          ownerID\n          referenceID\n          visibility\n          sharedWith\n          items {\n            __typename\n            ... on Codelist {\n              id\n              name\n              referenceID\n            }\n            ... on Phenotype {\n              id\n              name\n              ownerID\n            }\n          }\n        }\n        shared {\n          id\n          name\n          itemType\n          ownerID\n          sharedWith\n          items {\n            __typename\n            ... on Codelist {\n              id\n              name\n              referenceID\n            }\n            ... on Phenotype {\n              id\n              name\n              ownerID\n            }\n          }\n        }\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query searchEntities($entityType: SearchableEntity!, $query: String!, $pageSize: Int, $startCursor: ID) {\n    searchEntities(entityType: $entityType, query: $query, pageSize: $pageSize, startCursor: $startCursor) {\n      items {\n        __typename\n        ... on Collection {\n          id\n          name\n          description\n          ownerID\n          visibility\n          itemType\n          properties {\n            propertyID\n            name\n            value\n          }\n        }\n        ... on Codelist {\n          id\n          name\n          description\n          ownerID\n          containerHierarchy {\n            id\n            type\n            name\n            visibility\n          }\n        }\n        ... on Phenotype {\n          id\n          name\n          ownerID\n          medicalDescription\n          operationalDescription\n          properties {\n            propertyID\n            name\n            value\n          }\n          containerHierarchy {\n            id\n            type\n            name\n            visibility\n          }\n        }\n      }\n      total\n    }\n  }\n',
): typeof documents['\n  query searchEntities($entityType: SearchableEntity!, $query: String!, $pageSize: Int, $startCursor: ID) {\n    searchEntities(entityType: $entityType, query: $query, pageSize: $pageSize, startCursor: $startCursor) {\n      items {\n        __typename\n        ... on Collection {\n          id\n          name\n          description\n          ownerID\n          visibility\n          itemType\n          properties {\n            propertyID\n            name\n            value\n          }\n        }\n        ... on Codelist {\n          id\n          name\n          description\n          ownerID\n          containerHierarchy {\n            id\n            type\n            name\n            visibility\n          }\n        }\n        ... on Phenotype {\n          id\n          name\n          ownerID\n          medicalDescription\n          operationalDescription\n          properties {\n            propertyID\n            name\n            value\n          }\n          containerHierarchy {\n            id\n            type\n            name\n            visibility\n          }\n        }\n      }\n      total\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query users($ids: [ID!]) {\n    users(ids: $ids) {\n      id\n      externalId\n      name\n    }\n  }\n',
): typeof documents['\n  query users($ids: [ID!]) {\n    users(ids: $ids) {\n      id\n      externalId\n      name\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation createCollection($name: String!, $type: ItemType!) {\n    createCollection(name: $name, itemType: $type) {\n      id\n      name\n    }\n  }\n',
): typeof documents['\n  mutation createCollection($name: String!, $type: ItemType!) {\n    createCollection(name: $name, itemType: $type) {\n      id\n      name\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation createCodelist($name: String!, $position: ReferencePosition!) {\n    createCodelist(name: $name, position: $position) {\n      id\n      name\n    }\n  }\n',
): typeof documents['\n  mutation createCodelist($name: String!, $position: ReferencePosition!) {\n    createCodelist(name: $name, position: $position) {\n      id\n      name\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation createPhenotype($name: String!, $position: ReferencePosition!) {\n    createPhenotype(name: $name, position: $position) {\n      id\n      name\n    }\n  }\n',
): typeof documents['\n  mutation createPhenotype($name: String!, $position: ReferencePosition!) {\n    createPhenotype(name: $name, position: $position) {\n      id\n      name\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation moveCollection($collectionID: ID!, $refCollectionID: ID) {\n    moveCollection(collectionID: $collectionID, refCollectionID: $refCollectionID)\n  }\n',
): typeof documents['\n  mutation moveCollection($collectionID: ID!, $refCollectionID: ID) {\n    moveCollection(collectionID: $collectionID, refCollectionID: $refCollectionID)\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation deleteCollection($collectionID: ID!) {\n    deleteCollection(collectionID: $collectionID)\n  }\n',
): typeof documents['\n  mutation deleteCollection($collectionID: ID!) {\n    deleteCollection(collectionID: $collectionID)\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation moveCodelist($codelistID: ID!, $position: ReferencePosition!) {\n    moveCodelist(codelistID: $codelistID, position: $position)\n  }\n',
): typeof documents['\n  mutation moveCodelist($codelistID: ID!, $position: ReferencePosition!) {\n    moveCodelist(codelistID: $codelistID, position: $position)\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation updateCodelist($codelistID: ID!, $name: String, $description: String) {\n    updateCodelist(codelistID: $codelistID, name: $name, description: $description) {\n      id\n      name\n      description\n      containerHierarchy {\n        id\n        type\n        name\n        visibility\n      }\n    }\n  }\n',
): typeof documents['\n  mutation updateCodelist($codelistID: ID!, $name: String, $description: String) {\n    updateCodelist(codelistID: $codelistID, name: $name, description: $description) {\n      id\n      name\n      description\n      containerHierarchy {\n        id\n        type\n        name\n        visibility\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation deleteCodelist($codelistID: ID!) {\n    deleteCodelist(codelistID: $codelistID)\n  }\n',
): typeof documents['\n  mutation deleteCodelist($codelistID: ID!) {\n    deleteCodelist(codelistID: $codelistID)\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation deletePhenotype($phenotypeID: ID!) {\n    deletePhenotype(phenotypeID: $phenotypeID)\n  }\n',
): typeof documents['\n  mutation deletePhenotype($phenotypeID: ID!) {\n    deletePhenotype(phenotypeID: $phenotypeID)\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation clonePhenotype($phenotypeID: ID!, $position: ReferencePosition) {\n    clonePhenotype(phenotypeID: $phenotypeID, position: $position) {\n      id\n    }\n  }\n',
): typeof documents['\n  mutation clonePhenotype($phenotypeID: ID!, $position: ReferencePosition) {\n    clonePhenotype(phenotypeID: $phenotypeID, position: $position) {\n      id\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  fragment CodelistFields on Codelist {\n    id\n    name\n    description\n    ownerID\n    containerHierarchy {\n      id\n      type\n      name\n      visibility\n    }\n    transientCodesets {\n      ontology {\n        name\n      }\n      codes {\n        id\n      }\n    }\n    codesets {\n      ontology {\n        name\n      }\n      codes {\n        id\n      }\n    }\n  }\n',
): typeof documents['\n  fragment CodelistFields on Codelist {\n    id\n    name\n    description\n    ownerID\n    containerHierarchy {\n      id\n      type\n      name\n      visibility\n    }\n    transientCodesets {\n      ontology {\n        name\n      }\n      codes {\n        id\n      }\n    }\n    codesets {\n      ontology {\n        name\n      }\n      codes {\n        id\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  \n  query codelist($codelistID: ID!) {\n    codelist(codelistID: $codelistID) {\n      ...CodelistFields\n    }\n  }\n',
): typeof documents['\n  \n  query codelist($codelistID: ID!) {\n    codelist(codelistID: $codelistID) {\n      ...CodelistFields\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  \n  mutation cloneCodelist($codelistID: ID!, $position: ReferencePosition) {\n    cloneCodelist(codelistID: $codelistID, position: $position) {\n      ...CodelistFields\n    }\n  }\n',
): typeof documents['\n  \n  mutation cloneCodelist($codelistID: ID!, $position: ReferencePosition) {\n    cloneCodelist(codelistID: $codelistID, position: $position) {\n      ...CodelistFields\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query codelistChangeset($codelistID: ID!) {\n    codelist(codelistID: $codelistID) {\n      id\n      name\n      commits {\n        author {\n          id\n          externalId\n          name\n        }\n        createdAt\n        message\n        changesets {\n          ontology {\n            name\n          }\n          added {\n            id\n            code\n            description\n          }\n          removed {\n            id\n            code\n            description\n          }\n        }\n      }\n    }\n  }\n',
): typeof documents['\n  query codelistChangeset($codelistID: ID!) {\n    codelist(codelistID: $codelistID) {\n      id\n      name\n      commits {\n        author {\n          id\n          externalId\n          name\n        }\n        createdAt\n        message\n        changesets {\n          ontology {\n            name\n          }\n          added {\n            id\n            code\n            description\n          }\n          removed {\n            id\n            code\n            description\n          }\n        }\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  fragment ColectionFields on Collection {\n    id\n    name\n    itemType\n    description\n    sharedWith\n    ownerID\n    referenceID\n    visibility\n    properties {\n      propertyID\n      name\n      value\n    }\n    items {\n      __typename\n      ... on Codelist {\n        id\n        name\n        ownerID\n        referenceID\n        codesets {\n          ontology {\n            name\n          }\n          codes {\n            id\n          }\n        }\n        containerHierarchy {\n          id\n          type\n          name\n          visibility\n        }\n      }\n      ... on Phenotype {\n        id\n        name\n        ownerID\n        referenceID\n        properties {\n          propertyID\n          name\n          value\n        }\n        codelists {\n          name\n        }\n        containerHierarchy {\n          id\n          type\n          name\n          visibility\n        }\n      }\n    }\n  }\n',
): typeof documents['\n  fragment ColectionFields on Collection {\n    id\n    name\n    itemType\n    description\n    sharedWith\n    ownerID\n    referenceID\n    visibility\n    properties {\n      propertyID\n      name\n      value\n    }\n    items {\n      __typename\n      ... on Codelist {\n        id\n        name\n        ownerID\n        referenceID\n        codesets {\n          ontology {\n            name\n          }\n          codes {\n            id\n          }\n        }\n        containerHierarchy {\n          id\n          type\n          name\n          visibility\n        }\n      }\n      ... on Phenotype {\n        id\n        name\n        ownerID\n        referenceID\n        properties {\n          propertyID\n          name\n          value\n        }\n        codelists {\n          name\n        }\n        containerHierarchy {\n          id\n          type\n          name\n          visibility\n        }\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  \n  query getCollection($collectionID: ID!) {\n    collection(id: $collectionID) {\n      ...ColectionFields\n    }\n  }\n',
): typeof documents['\n  \n  query getCollection($collectionID: ID!) {\n    collection(id: $collectionID) {\n      ...ColectionFields\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  \n  mutation updateCollection(\n    $collectionID: ID!\n    $name: String\n    $description: String\n    $properties: [PropertyValueInput!]\n    $referenceID: ID\n    $ownerID: ID\n    $locked: Boolean\n  ) {\n    updateCollection(\n      collectionID: $collectionID\n      name: $name\n      description: $description\n      properties: $properties\n      referenceID: $referenceID\n      ownerID: $ownerID\n      locked: $locked\n    ) {\n      ...ColectionFields\n    }\n  }\n',
): typeof documents['\n  \n  mutation updateCollection(\n    $collectionID: ID!\n    $name: String\n    $description: String\n    $properties: [PropertyValueInput!]\n    $referenceID: ID\n    $ownerID: ID\n    $locked: Boolean\n  ) {\n    updateCollection(\n      collectionID: $collectionID\n      name: $name\n      description: $description\n      properties: $properties\n      referenceID: $referenceID\n      ownerID: $ownerID\n      locked: $locked\n    ) {\n      ...ColectionFields\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query getOntologies {\n    ontologies {\n      name\n      rootCodes {\n        id\n        code\n        description\n        numberOfChildren\n        lastDescendantId\n      }\n    }\n  }\n',
): typeof documents['\n  query getOntologies {\n    ontologies {\n      name\n      rootCodes {\n        id\n        code\n        description\n        numberOfChildren\n        lastDescendantId\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query fetchOntology($name: String!, $startCursor: ID) {\n    ontology(name: $name) {\n      name\n      rootCodes(startCursor: $startCursor) {\n        id\n        code\n        description\n        numberOfChildren\n        lastDescendantId\n        path {\n          id\n        }\n        children {\n          id\n          code\n          description\n          numberOfChildren\n          lastDescendantId\n          path {\n            id\n          }\n        }\n      }\n    }\n  }\n',
): typeof documents['\n  query fetchOntology($name: String!, $startCursor: ID) {\n    ontology(name: $name) {\n      name\n      rootCodes(startCursor: $startCursor) {\n        id\n        code\n        description\n        numberOfChildren\n        lastDescendantId\n        path {\n          id\n        }\n        children {\n          id\n          code\n          description\n          numberOfChildren\n          lastDescendantId\n          path {\n            id\n          }\n        }\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query getCode($codeID: ID!, $startCursor: ID) {\n    code(id: $codeID) {\n      id\n      code\n      description\n      numberOfChildren\n      lastDescendantId\n      path {\n        id\n      }\n      children(startCursor: $startCursor) {\n        id\n        code\n        description\n        numberOfChildren\n        lastDescendantId\n        path {\n          id\n        }\n      }\n    }\n  }\n',
): typeof documents['\n  query getCode($codeID: ID!, $startCursor: ID) {\n    code(id: $codeID) {\n      id\n      code\n      description\n      numberOfChildren\n      lastDescendantId\n      path {\n        id\n      }\n      children(startCursor: $startCursor) {\n        id\n        code\n        description\n        numberOfChildren\n        lastDescendantId\n        path {\n          id\n        }\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query getCodes($codeIDs: [ID!]!) {\n    codes(ids: $codeIDs) {\n      id\n      code\n      description\n      numberOfChildren\n      lastDescendantId\n      path {\n        id\n      }\n      children {\n        id\n        code\n        description\n        numberOfChildren\n        lastDescendantId\n        path {\n          id\n        }\n      }\n    }\n  }\n',
): typeof documents['\n  query getCodes($codeIDs: [ID!]!) {\n    codes(ids: $codeIDs) {\n      id\n      code\n      description\n      numberOfChildren\n      lastDescendantId\n      path {\n        id\n      }\n      children {\n        id\n        code\n        description\n        numberOfChildren\n        lastDescendantId\n        path {\n          id\n        }\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query searchCodes($ontologyID: ID!, $query: QueryData) {\n    searchCodes(ontologyID: $ontologyID, query: $query) {\n      id\n      code\n      description\n      numberOfChildren\n      lastDescendantId\n      path {\n        id\n      }\n      children {\n        id\n        code\n        description\n        numberOfChildren\n        lastDescendantId\n        path {\n          id\n        }\n      }\n    }\n  }\n',
): typeof documents['\n  query searchCodes($ontologyID: ID!, $query: QueryData) {\n    searchCodes(ontologyID: $ontologyID, query: $query) {\n      id\n      code\n      description\n      numberOfChildren\n      lastDescendantId\n      path {\n        id\n      }\n      children {\n        id\n        code\n        description\n        numberOfChildren\n        lastDescendantId\n        path {\n          id\n        }\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  \n  mutation storeTransientChanges($codelistID: ID!, $changes: [ChangesetInput!]!) {\n    storeTransientChanges(codelistID: $codelistID, changes: $changes) {\n      ...CodelistFields\n    }\n  }\n',
): typeof documents['\n  \n  mutation storeTransientChanges($codelistID: ID!, $changes: [ChangesetInput!]!) {\n    storeTransientChanges(codelistID: $codelistID, changes: $changes) {\n      ...CodelistFields\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  \n  mutation discardTransientChanges($codelistID: ID!) {\n    discardTransientChanges(codelistID: $codelistID) {\n      ...CodelistFields\n    }\n  }\n',
): typeof documents['\n  \n  mutation discardTransientChanges($codelistID: ID!) {\n    discardTransientChanges(codelistID: $codelistID) {\n      ...CodelistFields\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  \n  mutation commitChanges($codelistID: ID!, $commit: CommitInput!) {\n    commitChanges(codelistID: $codelistID, commit: $commit) {\n      ...CodelistFields\n    }\n  }\n',
): typeof documents['\n  \n  mutation commitChanges($codelistID: ID!, $commit: CommitInput!) {\n    commitChanges(codelistID: $codelistID, commit: $commit) {\n      ...CodelistFields\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation importCodelists($containerID: ID!, $codelists: [CodelistInput!]!, $filename: String!) {\n    importCodelists(containerID: $containerID, codelists: $codelists, filename: $filename) {\n      stats {\n        fully\n        partially\n        skipped\n      }\n      reports {\n        codelistName\n        skipped\n        partial\n        report\n      }\n    }\n  }\n',
): typeof documents['\n  mutation importCodelists($containerID: ID!, $codelists: [CodelistInput!]!, $filename: String!) {\n    importCodelists(containerID: $containerID, codelists: $codelists, filename: $filename) {\n      stats {\n        fully\n        partially\n        skipped\n      }\n      reports {\n        codelistName\n        skipped\n        partial\n        report\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation setCollectionPermissions($collectionID: ID!, $readerIds: [ID!]!) {\n    setCollectionPermissions(collectionID: $collectionID, readerIds: $readerIds)\n  }\n',
): typeof documents['\n  mutation setCollectionPermissions($collectionID: ID!, $readerIds: [ID!]!) {\n    setCollectionPermissions(collectionID: $collectionID, readerIds: $readerIds)\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  fragment PhenotypeFields on Phenotype {\n    id\n    name\n    medicalDescription\n    operationalDescription\n    referenceID\n    ownerID\n    properties {\n      propertyID\n      name\n      value\n    }\n    containerHierarchy {\n      type\n      id\n      name\n      visibility\n    }\n    codelists {\n      id\n      name\n      ownerID\n      codesets {\n        ontology {\n          name\n        }\n        codes {\n          id\n        }\n      }\n    }\n  }\n',
): typeof documents['\n  fragment PhenotypeFields on Phenotype {\n    id\n    name\n    medicalDescription\n    operationalDescription\n    referenceID\n    ownerID\n    properties {\n      propertyID\n      name\n      value\n    }\n    containerHierarchy {\n      type\n      id\n      name\n      visibility\n    }\n    codelists {\n      id\n      name\n      ownerID\n      codesets {\n        ontology {\n          name\n        }\n        codes {\n          id\n        }\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  \n  query fetchPhenotype($phenotypeID: ID!) {\n    phenotype(phenotypeID: $phenotypeID) {\n      ...PhenotypeFields\n    }\n  }\n',
): typeof documents['\n  \n  query fetchPhenotype($phenotypeID: ID!) {\n    phenotype(phenotypeID: $phenotypeID) {\n      ...PhenotypeFields\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  \n  mutation updatePhenotype(\n    $phenotypeID: ID!\n    $name: String\n    $position: ReferencePosition\n    $medicalDescription: String\n    $operationalDescription: String\n    $properties: [PropertyValueInput!]\n  ) {\n    updatePhenotype(\n      phenotypeID: $phenotypeID\n      name: $name\n      position: $position\n      medicalDescription: $medicalDescription\n      operationalDescription: $operationalDescription\n      properties: $properties\n    ) {\n      ...PhenotypeFields\n    }\n  }\n',
): typeof documents['\n  \n  mutation updatePhenotype(\n    $phenotypeID: ID!\n    $name: String\n    $position: ReferencePosition\n    $medicalDescription: String\n    $operationalDescription: String\n    $properties: [PropertyValueInput!]\n  ) {\n    updatePhenotype(\n      phenotypeID: $phenotypeID\n      name: $name\n      position: $position\n      medicalDescription: $medicalDescription\n      operationalDescription: $operationalDescription\n      properties: $properties\n    ) {\n      ...PhenotypeFields\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query getProperties($clazz: PropertyClass) {\n    properties(clazz: $clazz) {\n      id\n      name\n      class\n      dtype\n      required\n      readOnly\n      options\n    }\n  }\n',
): typeof documents['\n  query getProperties($clazz: PropertyClass) {\n    properties(clazz: $clazz) {\n      id\n      name\n      class\n      dtype\n      required\n      readOnly\n      options\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation updateMe($tutorialState: String) {\n    updateMe(tutorialState: $tutorialState) {\n      tutorialState\n    }\n  }\n',
): typeof documents['\n  mutation updateMe($tutorialState: String) {\n    updateMe(tutorialState: $tutorialState) {\n      tutorialState\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  fragment PartialCode on Code {\n    path {\n      id\n    }\n  }\n',
): typeof documents['\n  fragment PartialCode on Code {\n    path {\n      id\n    }\n  }\n']

export function gql(source: string) {
  return (documents as any)[source] ?? {}
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<
  infer TType,
  any
>
  ? TType
  : never
