/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Datetime: { input: any; output: any; }
};

export type Changeset = {
  __typename?: 'Changeset';
  added?: Maybe<Array<Code>>;
  ontology: Ontology;
  removed?: Maybe<Array<Code>>;
};

export type ChangesetInput = {
  added?: InputMaybe<Array<Scalars['ID']['input']>>;
  ontologyID: Scalars['ID']['input'];
  removed?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type Code = {
  __typename?: 'Code';
  children?: Maybe<Array<Code>>;
  code: Scalars['String']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastDescendantId: Scalars['Int']['output'];
  numberOfChildren: Scalars['Int']['output'];
  parent?: Maybe<Code>;
  path: Array<Code>;
};


export type CodeChildrenArgs = {
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  startCursor?: InputMaybe<Scalars['ID']['input']>;
};

export type Codelist = {
  __typename?: 'Codelist';
  codesets: Array<Codeset>;
  commits: Array<Commit>;
  containerHierarchy: Array<ContainerSpec>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  ownerID: Scalars['ID']['output'];
  referenceID?: Maybe<Scalars['ID']['output']>;
  transientCodesets?: Maybe<Array<Codeset>>;
  transientCommit?: Maybe<Commit>;
};

export type CodelistInput = {
  codesets: Array<CodesetInput>;
  name: Scalars['String']['input'];
};

export type Codeset = {
  __typename?: 'Codeset';
  codes: Array<Code>;
  ontology: Ontology;
};

export type CodesetInput = {
  codes?: InputMaybe<Array<Scalars['String']['input']>>;
  ontologyID: Scalars['ID']['input'];
};

export type Collection = {
  __typename?: 'Collection';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  itemType: ItemType;
  items: Array<ContainerItem>;
  locked: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  ownerID: Scalars['ID']['output'];
  properties: Array<PropertyValue>;
  referenceID?: Maybe<Scalars['ID']['output']>;
  sharedWith: Array<Scalars['ID']['output']>;
  /**
   * visibility is calculated for the current user and not an
   * inherent property of ContainerSpec.
   */
  visibility: ContainerVisibility;
};

export type Commit = {
  __typename?: 'Commit';
  author: User;
  changesets: Array<Changeset>;
  createdAt: Scalars['Datetime']['output'];
  message: Scalars['String']['output'];
};

export type CommitInput = {
  changes: Array<ChangesetInput>;
  message: Scalars['String']['input'];
};

export type ContainerItem = Codelist | Phenotype;

export type ContainerSpec = {
  __typename?: 'ContainerSpec';
  id: Scalars['ID']['output'];
  locked: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  type: ContainerType;
  /**
   * visibility is calculated for the current user and not an
   * inherent property of ContainerSpec.
   */
  visibility: ContainerVisibility;
};

export enum ContainerType {
  Collection = 'Collection',
  Phenotype = 'Phenotype'
}

export enum ContainerVisibility {
  Private = 'Private',
  Public = 'Public',
  Shared = 'Shared'
}

export type ImportCodelistsResponse = {
  __typename?: 'ImportCodelistsResponse';
  reports?: Maybe<Array<ImportReport>>;
  stats: ImportStats;
};

export type ImportReport = {
  __typename?: 'ImportReport';
  codelistID?: Maybe<Scalars['ID']['output']>;
  codelistName: Scalars['String']['output'];
  partial?: Maybe<Scalars['Boolean']['output']>;
  report?: Maybe<Scalars['String']['output']>;
  skipped: Scalars['Boolean']['output'];
};

export type ImportStats = {
  __typename?: 'ImportStats';
  fully: Scalars['Int']['output'];
  partially: Scalars['Int']['output'];
  skipped: Scalars['Int']['output'];
};

export enum ItemType {
  Codelist = 'Codelist',
  Phenotype = 'Phenotype'
}

export type Me = {
  __typename?: 'Me';
  externalId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  tutorialState: Scalars['String']['output'];
  workspace: Workspace;
};

export type Mutation = {
  __typename?: 'Mutation';
  cloneCodelist: Codelist;
  clonePhenotype: Phenotype;
  commitChanges: Codelist;
  createCodelist?: Maybe<Codelist>;
  createCollection?: Maybe<Collection>;
  createPhenotype?: Maybe<Phenotype>;
  deleteCodelist?: Maybe<Scalars['Boolean']['output']>;
  deleteCollection?: Maybe<Scalars['Boolean']['output']>;
  deletePhenotype?: Maybe<Scalars['Boolean']['output']>;
  discardTransientChanges: Codelist;
  importCodelists?: Maybe<ImportCodelistsResponse>;
  moveCodelist?: Maybe<Scalars['Boolean']['output']>;
  moveCollection?: Maybe<Scalars['Boolean']['output']>;
  setCollectionPermissions?: Maybe<Scalars['Boolean']['output']>;
  storeTransientChanges: Codelist;
  updateCodelist?: Maybe<Codelist>;
  updateCollection?: Maybe<Collection>;
  updateMe: Me;
  updatePhenotype?: Maybe<Phenotype>;
};


export type MutationCloneCodelistArgs = {
  codelistID: Scalars['ID']['input'];
  position?: InputMaybe<ReferencePosition>;
};


export type MutationClonePhenotypeArgs = {
  phenotypeID: Scalars['ID']['input'];
  position?: InputMaybe<ReferencePosition>;
};


export type MutationCommitChangesArgs = {
  codelistID: Scalars['ID']['input'];
  commit: CommitInput;
};


export type MutationCreateCodelistArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  position: ReferencePosition;
  referenceID?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationCreateCollectionArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  itemType: ItemType;
  name: Scalars['String']['input'];
  properties?: InputMaybe<Array<PropertyValueInput>>;
  referenceID?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationCreatePhenotypeArgs = {
  medicalDescription?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  operationalDescription?: InputMaybe<Scalars['String']['input']>;
  position: ReferencePosition;
  properties?: InputMaybe<Array<PropertyValueInput>>;
  referenceID?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationDeleteCodelistArgs = {
  codelistID: Scalars['ID']['input'];
};


export type MutationDeleteCollectionArgs = {
  collectionID: Scalars['ID']['input'];
};


export type MutationDeletePhenotypeArgs = {
  phenotypeID: Scalars['ID']['input'];
};


export type MutationDiscardTransientChangesArgs = {
  codelistID: Scalars['ID']['input'];
};


export type MutationImportCodelistsArgs = {
  codelists: Array<CodelistInput>;
  containerID: Scalars['ID']['input'];
  filename: Scalars['String']['input'];
};


export type MutationMoveCodelistArgs = {
  codelistID: Scalars['ID']['input'];
  position: ReferencePosition;
};


export type MutationMoveCollectionArgs = {
  collectionID: Scalars['ID']['input'];
  refCollectionID?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationSetCollectionPermissionsArgs = {
  collectionID: Scalars['ID']['input'];
  readerIds: Array<Scalars['ID']['input']>;
};


export type MutationStoreTransientChangesArgs = {
  changes: Array<ChangesetInput>;
  codelistID: Scalars['ID']['input'];
};


export type MutationUpdateCodelistArgs = {
  codelistID: Scalars['ID']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  referenceID?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationUpdateCollectionArgs = {
  collectionID: Scalars['ID']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  locked?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  ownerID?: InputMaybe<Scalars['ID']['input']>;
  properties?: InputMaybe<Array<PropertyValueInput>>;
  referenceID?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationUpdateMeArgs = {
  tutorialState?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdatePhenotypeArgs = {
  medicalDescription?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  operationalDescription?: InputMaybe<Scalars['String']['input']>;
  phenotypeID: Scalars['ID']['input'];
  position?: InputMaybe<ReferencePosition>;
  properties?: InputMaybe<Array<PropertyValueInput>>;
  referenceID?: InputMaybe<Scalars['ID']['input']>;
};

export type Ontology = {
  __typename?: 'Ontology';
  name: Scalars['String']['output'];
  rootCodes: Array<Code>;
};


export type OntologyRootCodesArgs = {
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  startCursor?: InputMaybe<Scalars['ID']['input']>;
};

export type Phenotype = {
  __typename?: 'Phenotype';
  codelists: Array<Codelist>;
  containerHierarchy: Array<ContainerSpec>;
  id: Scalars['ID']['output'];
  medicalDescription?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  operationalDescription?: Maybe<Scalars['String']['output']>;
  ownerID: Scalars['ID']['output'];
  properties: Array<PropertyValue>;
  referenceID?: Maybe<Scalars['ID']['output']>;
};

export type Property = {
  __typename?: 'Property';
  class: PropertyClass;
  dtype: PropertyDType;
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  /** If dtype is Enum this lists all valid options. */
  options?: Maybe<Array<Scalars['String']['output']>>;
  readOnly: Scalars['Boolean']['output'];
  required: Scalars['Boolean']['output'];
};

export enum PropertyClass {
  Collection = 'Collection',
  Phenotype = 'Phenotype'
}

export enum PropertyDType {
  Enum = 'Enum',
  Number = 'Number',
  Text = 'Text',
  Time = 'Time',
  User = 'User'
}

export type PropertyValue = {
  __typename?: 'PropertyValue';
  name: Scalars['String']['output'];
  propertyID?: Maybe<Scalars['Int']['output']>;
  value: Scalars['String']['output'];
};

/**
 * Input for creating or updating a property value.
 * If propertyID is not provided, a custom property is created.
 * A value of null deletes the property.
 */
export type PropertyValueInput = {
  name: Scalars['String']['input'];
  propertyID?: InputMaybe<Scalars['Int']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

export type Query = {
  __typename?: 'Query';
  code?: Maybe<Code>;
  codelist: Codelist;
  codes: Array<Code>;
  collection: Collection;
  ontologies: Array<Ontology>;
  ontology?: Maybe<Ontology>;
  phenotype: Phenotype;
  properties: Array<Property>;
  searchCodes: Array<Code>;
  searchEntities: SearchResults;
  self: Me;
  users: Array<User>;
};


export type QueryCodeArgs = {
  id: Scalars['ID']['input'];
};


export type QueryCodelistArgs = {
  codelistID: Scalars['ID']['input'];
};


export type QueryCodesArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type QueryCollectionArgs = {
  id: Scalars['ID']['input'];
  itemType?: InputMaybe<ItemType>;
};


export type QueryOntologyArgs = {
  name: Scalars['String']['input'];
};


export type QueryPhenotypeArgs = {
  phenotypeID: Scalars['ID']['input'];
};


export type QueryPropertiesArgs = {
  clazz?: InputMaybe<PropertyClass>;
};


export type QuerySearchCodesArgs = {
  ontologyID: Scalars['ID']['input'];
  query?: InputMaybe<QueryData>;
};


export type QuerySearchEntitiesArgs = {
  entityType: SearchableEntity;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
  startCursor?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryUsersArgs = {
  ids?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type QueryData = {
  code?: InputMaybe<QueryDataCode>;
  description?: InputMaybe<Scalars['String']['input']>;
};

export type QueryDataCode = {
  type?: InputMaybe<QueryDataCodeType>;
  value: Scalars['String']['input'];
};

export enum QueryDataCodeType {
  Ilike = 'ILIKE',
  Posix = 'POSIX'
}

export type ReferencePosition = {
  containerID?: InputMaybe<Scalars['ID']['input']>;
  itemID?: InputMaybe<Scalars['ID']['input']>;
};

export type SearchResultItem = Codelist | Collection | Phenotype;

export type SearchResults = {
  __typename?: 'SearchResults';
  items: Array<SearchResultItem>;
  total: Scalars['Int']['output'];
};

export enum SearchableEntity {
  Codelist = 'Codelist',
  CodelistCollection = 'CodelistCollection',
  Phenotype = 'Phenotype',
  PhenotypeCollection = 'PhenotypeCollection'
}

export type User = {
  __typename?: 'User';
  externalId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type Workspace = {
  __typename?: 'Workspace';
  collections: Array<Collection>;
  libraries: Array<Collection>;
  shared: Array<Collection>;
};


export type WorkspaceCollectionsArgs = {
  itemType?: InputMaybe<ItemType>;
};


export type WorkspaceSharedArgs = {
  itemType?: InputMaybe<ItemType>;
};

export type SelfQueryVariables = Exact<{ [key: string]: never; }>;


export type SelfQuery = { __typename?: 'Query', self: { __typename?: 'Me', id: string, externalId: string, name: string, tutorialState: string, workspace: { __typename?: 'Workspace', collections: Array<{ __typename?: 'Collection', id: string, name: string, itemType: ItemType, ownerID: string, referenceID?: string | null, visibility: ContainerVisibility, sharedWith: Array<string>, items: Array<{ __typename: 'Codelist', id: string, name: string, referenceID?: string | null } | { __typename: 'Phenotype', id: string, name: string, ownerID: string }> }>, shared: Array<{ __typename?: 'Collection', id: string, name: string, itemType: ItemType, ownerID: string, sharedWith: Array<string>, items: Array<{ __typename: 'Codelist', id: string, name: string, referenceID?: string | null } | { __typename: 'Phenotype', id: string, name: string, ownerID: string }> }> } } };

export type SearchEntitiesQueryVariables = Exact<{
  entityType: SearchableEntity;
  query: Scalars['String']['input'];
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  startCursor?: InputMaybe<Scalars['ID']['input']>;
}>;


export type SearchEntitiesQuery = { __typename?: 'Query', searchEntities: { __typename?: 'SearchResults', total: number, items: Array<{ __typename: 'Codelist', id: string, name: string, description?: string | null, ownerID: string, containerHierarchy: Array<{ __typename?: 'ContainerSpec', id: string, type: ContainerType, name: string, visibility: ContainerVisibility }> } | { __typename: 'Collection', id: string, name: string, description?: string | null, ownerID: string, visibility: ContainerVisibility, itemType: ItemType, properties: Array<{ __typename?: 'PropertyValue', propertyID?: number | null, name: string, value: string }> } | { __typename: 'Phenotype', id: string, name: string, ownerID: string, medicalDescription?: string | null, operationalDescription?: string | null, properties: Array<{ __typename?: 'PropertyValue', propertyID?: number | null, name: string, value: string }>, containerHierarchy: Array<{ __typename?: 'ContainerSpec', id: string, type: ContainerType, name: string, visibility: ContainerVisibility }> }> } };

export type UsersQueryVariables = Exact<{
  ids?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
}>;


export type UsersQuery = { __typename?: 'Query', users: Array<{ __typename?: 'User', id: string, externalId: string, name: string }> };

export type CreateCollectionMutationVariables = Exact<{
  name: Scalars['String']['input'];
  type: ItemType;
}>;


export type CreateCollectionMutation = { __typename?: 'Mutation', createCollection?: { __typename?: 'Collection', id: string, name: string } | null };

export type CreateCodelistMutationVariables = Exact<{
  name: Scalars['String']['input'];
  position: ReferencePosition;
}>;


export type CreateCodelistMutation = { __typename?: 'Mutation', createCodelist?: { __typename?: 'Codelist', id: string, name: string } | null };

export type CreatePhenotypeMutationVariables = Exact<{
  name: Scalars['String']['input'];
  position: ReferencePosition;
}>;


export type CreatePhenotypeMutation = { __typename?: 'Mutation', createPhenotype?: { __typename?: 'Phenotype', id: string, name: string } | null };

export type MoveCollectionMutationVariables = Exact<{
  collectionID: Scalars['ID']['input'];
  refCollectionID?: InputMaybe<Scalars['ID']['input']>;
}>;


export type MoveCollectionMutation = { __typename?: 'Mutation', moveCollection?: boolean | null };

export type DeleteCollectionMutationVariables = Exact<{
  collectionID: Scalars['ID']['input'];
}>;


export type DeleteCollectionMutation = { __typename?: 'Mutation', deleteCollection?: boolean | null };

export type MoveCodelistMutationVariables = Exact<{
  codelistID: Scalars['ID']['input'];
  position: ReferencePosition;
}>;


export type MoveCodelistMutation = { __typename?: 'Mutation', moveCodelist?: boolean | null };

export type UpdateCodelistMutationVariables = Exact<{
  codelistID: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateCodelistMutation = { __typename?: 'Mutation', updateCodelist?: { __typename?: 'Codelist', id: string, name: string, description?: string | null, containerHierarchy: Array<{ __typename?: 'ContainerSpec', id: string, type: ContainerType, name: string, visibility: ContainerVisibility }> } | null };

export type DeleteCodelistMutationVariables = Exact<{
  codelistID: Scalars['ID']['input'];
}>;


export type DeleteCodelistMutation = { __typename?: 'Mutation', deleteCodelist?: boolean | null };

export type DeletePhenotypeMutationVariables = Exact<{
  phenotypeID: Scalars['ID']['input'];
}>;


export type DeletePhenotypeMutation = { __typename?: 'Mutation', deletePhenotype?: boolean | null };

export type ClonePhenotypeMutationVariables = Exact<{
  phenotypeID: Scalars['ID']['input'];
  position?: InputMaybe<ReferencePosition>;
}>;


export type ClonePhenotypeMutation = { __typename?: 'Mutation', clonePhenotype: { __typename?: 'Phenotype', id: string } };

export type CodelistFieldsFragment = { __typename?: 'Codelist', id: string, name: string, description?: string | null, ownerID: string, containerHierarchy: Array<{ __typename?: 'ContainerSpec', id: string, type: ContainerType, name: string, visibility: ContainerVisibility }>, transientCodesets?: Array<{ __typename?: 'Codeset', ontology: { __typename?: 'Ontology', name: string }, codes: Array<{ __typename?: 'Code', id: string }> }> | null, codesets: Array<{ __typename?: 'Codeset', ontology: { __typename?: 'Ontology', name: string }, codes: Array<{ __typename?: 'Code', id: string }> }> } & { ' $fragmentName'?: 'CodelistFieldsFragment' };

export type CodelistQueryVariables = Exact<{
  codelistID: Scalars['ID']['input'];
}>;


export type CodelistQuery = { __typename?: 'Query', codelist: (
    { __typename?: 'Codelist' }
    & { ' $fragmentRefs'?: { 'CodelistFieldsFragment': CodelistFieldsFragment } }
  ) };

export type CloneCodelistMutationVariables = Exact<{
  codelistID: Scalars['ID']['input'];
  position?: InputMaybe<ReferencePosition>;
}>;


export type CloneCodelistMutation = { __typename?: 'Mutation', cloneCodelist: (
    { __typename?: 'Codelist' }
    & { ' $fragmentRefs'?: { 'CodelistFieldsFragment': CodelistFieldsFragment } }
  ) };

export type CodelistChangesetQueryVariables = Exact<{
  codelistID: Scalars['ID']['input'];
}>;


export type CodelistChangesetQuery = { __typename?: 'Query', codelist: { __typename?: 'Codelist', id: string, name: string, commits: Array<{ __typename?: 'Commit', createdAt: any, message: string, author: { __typename?: 'User', id: string, externalId: string, name: string }, changesets: Array<{ __typename?: 'Changeset', ontology: { __typename?: 'Ontology', name: string }, added?: Array<{ __typename?: 'Code', id: string, code: string, description: string }> | null, removed?: Array<{ __typename?: 'Code', id: string, code: string, description: string }> | null }> }> } };

export type ColectionFieldsFragment = { __typename?: 'Collection', id: string, name: string, itemType: ItemType, description?: string | null, sharedWith: Array<string>, ownerID: string, referenceID?: string | null, visibility: ContainerVisibility, properties: Array<{ __typename?: 'PropertyValue', propertyID?: number | null, name: string, value: string }>, items: Array<{ __typename: 'Codelist', id: string, name: string, ownerID: string, referenceID?: string | null, codesets: Array<{ __typename?: 'Codeset', ontology: { __typename?: 'Ontology', name: string }, codes: Array<{ __typename?: 'Code', id: string }> }>, containerHierarchy: Array<{ __typename?: 'ContainerSpec', id: string, type: ContainerType, name: string, visibility: ContainerVisibility }> } | { __typename: 'Phenotype', id: string, name: string, ownerID: string, referenceID?: string | null, properties: Array<{ __typename?: 'PropertyValue', propertyID?: number | null, name: string, value: string }>, codelists: Array<{ __typename?: 'Codelist', name: string }>, containerHierarchy: Array<{ __typename?: 'ContainerSpec', id: string, type: ContainerType, name: string, visibility: ContainerVisibility }> }> } & { ' $fragmentName'?: 'ColectionFieldsFragment' };

export type GetCollectionQueryVariables = Exact<{
  collectionID: Scalars['ID']['input'];
}>;


export type GetCollectionQuery = { __typename?: 'Query', collection: (
    { __typename?: 'Collection' }
    & { ' $fragmentRefs'?: { 'ColectionFieldsFragment': ColectionFieldsFragment } }
  ) };

export type UpdateCollectionMutationVariables = Exact<{
  collectionID: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  properties?: InputMaybe<Array<PropertyValueInput> | PropertyValueInput>;
  referenceID?: InputMaybe<Scalars['ID']['input']>;
  ownerID?: InputMaybe<Scalars['ID']['input']>;
  locked?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type UpdateCollectionMutation = { __typename?: 'Mutation', updateCollection?: (
    { __typename?: 'Collection' }
    & { ' $fragmentRefs'?: { 'ColectionFieldsFragment': ColectionFieldsFragment } }
  ) | null };

export type GetOntologiesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetOntologiesQuery = { __typename?: 'Query', ontologies: Array<{ __typename?: 'Ontology', name: string, rootCodes: Array<{ __typename?: 'Code', id: string, code: string, description: string, numberOfChildren: number, lastDescendantId: number }> }> };

export type FetchOntologyQueryVariables = Exact<{
  name: Scalars['String']['input'];
  startCursor?: InputMaybe<Scalars['ID']['input']>;
}>;


export type FetchOntologyQuery = { __typename?: 'Query', ontology?: { __typename?: 'Ontology', name: string, rootCodes: Array<{ __typename?: 'Code', id: string, code: string, description: string, numberOfChildren: number, lastDescendantId: number, path: Array<{ __typename?: 'Code', id: string }>, children?: Array<{ __typename?: 'Code', id: string, code: string, description: string, numberOfChildren: number, lastDescendantId: number, path: Array<{ __typename?: 'Code', id: string }> }> | null }> } | null };

export type GetCodeQueryVariables = Exact<{
  codeID: Scalars['ID']['input'];
  startCursor?: InputMaybe<Scalars['ID']['input']>;
}>;


export type GetCodeQuery = { __typename?: 'Query', code?: { __typename?: 'Code', id: string, code: string, description: string, numberOfChildren: number, lastDescendantId: number, path: Array<{ __typename?: 'Code', id: string }>, children?: Array<{ __typename?: 'Code', id: string, code: string, description: string, numberOfChildren: number, lastDescendantId: number, path: Array<{ __typename?: 'Code', id: string }> }> | null } | null };

export type GetCodesQueryVariables = Exact<{
  codeIDs: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type GetCodesQuery = { __typename?: 'Query', codes: Array<{ __typename?: 'Code', id: string, code: string, description: string, numberOfChildren: number, lastDescendantId: number, path: Array<{ __typename?: 'Code', id: string }>, children?: Array<{ __typename?: 'Code', id: string, code: string, description: string, numberOfChildren: number, lastDescendantId: number, path: Array<{ __typename?: 'Code', id: string }> }> | null }> };

export type SearchCodesQueryVariables = Exact<{
  ontologyID: Scalars['ID']['input'];
  query?: InputMaybe<QueryData>;
}>;


export type SearchCodesQuery = { __typename?: 'Query', searchCodes: Array<{ __typename?: 'Code', id: string, code: string, description: string, numberOfChildren: number, lastDescendantId: number, path: Array<{ __typename?: 'Code', id: string }>, children?: Array<{ __typename?: 'Code', id: string, code: string, description: string, numberOfChildren: number, lastDescendantId: number, path: Array<{ __typename?: 'Code', id: string }> }> | null }> };

export type StoreTransientChangesMutationVariables = Exact<{
  codelistID: Scalars['ID']['input'];
  changes: Array<ChangesetInput> | ChangesetInput;
}>;


export type StoreTransientChangesMutation = { __typename?: 'Mutation', storeTransientChanges: (
    { __typename?: 'Codelist' }
    & { ' $fragmentRefs'?: { 'CodelistFieldsFragment': CodelistFieldsFragment } }
  ) };

export type DiscardTransientChangesMutationVariables = Exact<{
  codelistID: Scalars['ID']['input'];
}>;


export type DiscardTransientChangesMutation = { __typename?: 'Mutation', discardTransientChanges: (
    { __typename?: 'Codelist' }
    & { ' $fragmentRefs'?: { 'CodelistFieldsFragment': CodelistFieldsFragment } }
  ) };

export type CommitChangesMutationVariables = Exact<{
  codelistID: Scalars['ID']['input'];
  commit: CommitInput;
}>;


export type CommitChangesMutation = { __typename?: 'Mutation', commitChanges: (
    { __typename?: 'Codelist' }
    & { ' $fragmentRefs'?: { 'CodelistFieldsFragment': CodelistFieldsFragment } }
  ) };

export type ImportCodelistsMutationVariables = Exact<{
  containerID: Scalars['ID']['input'];
  codelists: Array<CodelistInput> | CodelistInput;
  filename: Scalars['String']['input'];
}>;


export type ImportCodelistsMutation = { __typename?: 'Mutation', importCodelists?: { __typename?: 'ImportCodelistsResponse', stats: { __typename?: 'ImportStats', fully: number, partially: number, skipped: number }, reports?: Array<{ __typename?: 'ImportReport', codelistName: string, skipped: boolean, partial?: boolean | null, report?: string | null }> | null } | null };

export type SetCollectionPermissionsMutationVariables = Exact<{
  collectionID: Scalars['ID']['input'];
  readerIds: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type SetCollectionPermissionsMutation = { __typename?: 'Mutation', setCollectionPermissions?: boolean | null };

export type PhenotypeFieldsFragment = { __typename?: 'Phenotype', id: string, name: string, medicalDescription?: string | null, operationalDescription?: string | null, referenceID?: string | null, ownerID: string, properties: Array<{ __typename?: 'PropertyValue', propertyID?: number | null, name: string, value: string }>, containerHierarchy: Array<{ __typename?: 'ContainerSpec', type: ContainerType, id: string, name: string, visibility: ContainerVisibility }>, codelists: Array<{ __typename?: 'Codelist', id: string, name: string, ownerID: string, codesets: Array<{ __typename?: 'Codeset', ontology: { __typename?: 'Ontology', name: string }, codes: Array<{ __typename?: 'Code', id: string }> }> }> } & { ' $fragmentName'?: 'PhenotypeFieldsFragment' };

export type FetchPhenotypeQueryVariables = Exact<{
  phenotypeID: Scalars['ID']['input'];
}>;


export type FetchPhenotypeQuery = { __typename?: 'Query', phenotype: (
    { __typename?: 'Phenotype' }
    & { ' $fragmentRefs'?: { 'PhenotypeFieldsFragment': PhenotypeFieldsFragment } }
  ) };

export type UpdatePhenotypeMutationVariables = Exact<{
  phenotypeID: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  position?: InputMaybe<ReferencePosition>;
  medicalDescription?: InputMaybe<Scalars['String']['input']>;
  operationalDescription?: InputMaybe<Scalars['String']['input']>;
  properties?: InputMaybe<Array<PropertyValueInput> | PropertyValueInput>;
}>;


export type UpdatePhenotypeMutation = { __typename?: 'Mutation', updatePhenotype?: (
    { __typename?: 'Phenotype' }
    & { ' $fragmentRefs'?: { 'PhenotypeFieldsFragment': PhenotypeFieldsFragment } }
  ) | null };

export type GetPropertiesQueryVariables = Exact<{
  clazz?: InputMaybe<PropertyClass>;
}>;


export type GetPropertiesQuery = { __typename?: 'Query', properties: Array<{ __typename?: 'Property', id: number, name: string, class: PropertyClass, dtype: PropertyDType, required: boolean, readOnly: boolean, options?: Array<string> | null }> };

export type UpdateMeMutationVariables = Exact<{
  tutorialState?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateMeMutation = { __typename?: 'Mutation', updateMe: { __typename?: 'Me', tutorialState: string } };

export type PartialCodeFragment = { __typename?: 'Code', path: Array<{ __typename?: 'Code', id: string }> } & { ' $fragmentName'?: 'PartialCodeFragment' };

export const CodelistFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CodelistFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Codelist"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"containerHierarchy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transientCodesets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ontology"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"codes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"codesets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ontology"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"codes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<CodelistFieldsFragment, unknown>;
export const ColectionFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ColectionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Collection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"itemType"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sharedWith"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"referenceID"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"propertyID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Codelist"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"referenceID"}},{"kind":"Field","name":{"kind":"Name","value":"codesets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ontology"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"codes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"containerHierarchy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Phenotype"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"referenceID"}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"propertyID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"codelists"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"containerHierarchy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ColectionFieldsFragment, unknown>;
export const PhenotypeFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PhenotypeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Phenotype"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"medicalDescription"}},{"kind":"Field","name":{"kind":"Name","value":"operationalDescription"}},{"kind":"Field","name":{"kind":"Name","value":"referenceID"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"propertyID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"containerHierarchy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}},{"kind":"Field","name":{"kind":"Name","value":"codelists"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"codesets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ontology"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"codes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<PhenotypeFieldsFragment, unknown>;
export const PartialCodeFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PartialCode"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Code"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<PartialCodeFragment, unknown>;
export const SelfDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"self"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"self"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"externalId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"tutorialState"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"collections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"itemType"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"referenceID"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"sharedWith"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Codelist"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"referenceID"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Phenotype"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"shared"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"itemType"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"sharedWith"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Codelist"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"referenceID"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Phenotype"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<SelfQuery, SelfQueryVariables>;
export const SearchEntitiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"searchEntities"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"entityType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SearchableEntity"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pageSize"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startCursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchEntities"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"entityType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"entityType"}}},{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}},{"kind":"Argument","name":{"kind":"Name","value":"pageSize"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pageSize"}}},{"kind":"Argument","name":{"kind":"Name","value":"startCursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startCursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Collection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"itemType"}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"propertyID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Codelist"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"containerHierarchy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Phenotype"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"medicalDescription"}},{"kind":"Field","name":{"kind":"Name","value":"operationalDescription"}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"propertyID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"containerHierarchy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<SearchEntitiesQuery, SearchEntitiesQueryVariables>;
export const UsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"users"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"externalId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<UsersQuery, UsersQueryVariables>;
export const CreateCollectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createCollection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ItemType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"itemType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<CreateCollectionMutation, CreateCollectionMutationVariables>;
export const CreateCodelistDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createCodelist"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"position"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ReferencePosition"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCodelist"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"position"},"value":{"kind":"Variable","name":{"kind":"Name","value":"position"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<CreateCodelistMutation, CreateCodelistMutationVariables>;
export const CreatePhenotypeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createPhenotype"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"position"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ReferencePosition"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPhenotype"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"position"},"value":{"kind":"Variable","name":{"kind":"Name","value":"position"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<CreatePhenotypeMutation, CreatePhenotypeMutationVariables>;
export const MoveCollectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"moveCollection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"collectionID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"refCollectionID"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"moveCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"collectionID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"collectionID"}}},{"kind":"Argument","name":{"kind":"Name","value":"refCollectionID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"refCollectionID"}}}]}]}}]} as unknown as DocumentNode<MoveCollectionMutation, MoveCollectionMutationVariables>;
export const DeleteCollectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteCollection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"collectionID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"collectionID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"collectionID"}}}]}]}}]} as unknown as DocumentNode<DeleteCollectionMutation, DeleteCollectionMutationVariables>;
export const MoveCodelistDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"moveCodelist"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"codelistID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"position"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ReferencePosition"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"moveCodelist"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"codelistID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"codelistID"}}},{"kind":"Argument","name":{"kind":"Name","value":"position"},"value":{"kind":"Variable","name":{"kind":"Name","value":"position"}}}]}]}}]} as unknown as DocumentNode<MoveCodelistMutation, MoveCodelistMutationVariables>;
export const UpdateCodelistDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateCodelist"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"codelistID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCodelist"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"codelistID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"codelistID"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"containerHierarchy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateCodelistMutation, UpdateCodelistMutationVariables>;
export const DeleteCodelistDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteCodelist"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"codelistID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteCodelist"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"codelistID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"codelistID"}}}]}]}}]} as unknown as DocumentNode<DeleteCodelistMutation, DeleteCodelistMutationVariables>;
export const DeletePhenotypeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deletePhenotype"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"phenotypeID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletePhenotype"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"phenotypeID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"phenotypeID"}}}]}]}}]} as unknown as DocumentNode<DeletePhenotypeMutation, DeletePhenotypeMutationVariables>;
export const ClonePhenotypeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"clonePhenotype"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"phenotypeID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"position"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ReferencePosition"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clonePhenotype"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"phenotypeID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"phenotypeID"}}},{"kind":"Argument","name":{"kind":"Name","value":"position"},"value":{"kind":"Variable","name":{"kind":"Name","value":"position"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<ClonePhenotypeMutation, ClonePhenotypeMutationVariables>;
export const CodelistDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"codelist"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"codelistID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"codelist"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"codelistID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"codelistID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CodelistFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CodelistFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Codelist"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"containerHierarchy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transientCodesets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ontology"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"codes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"codesets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ontology"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"codes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<CodelistQuery, CodelistQueryVariables>;
export const CloneCodelistDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"cloneCodelist"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"codelistID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"position"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ReferencePosition"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cloneCodelist"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"codelistID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"codelistID"}}},{"kind":"Argument","name":{"kind":"Name","value":"position"},"value":{"kind":"Variable","name":{"kind":"Name","value":"position"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CodelistFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CodelistFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Codelist"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"containerHierarchy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transientCodesets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ontology"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"codes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"codesets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ontology"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"codes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<CloneCodelistMutation, CloneCodelistMutationVariables>;
export const CodelistChangesetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"codelistChangeset"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"codelistID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"codelist"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"codelistID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"codelistID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"commits"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"externalId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"changesets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ontology"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"added"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"removed"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<CodelistChangesetQuery, CodelistChangesetQueryVariables>;
export const GetCollectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getCollection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"collectionID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"collection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"collectionID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ColectionFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ColectionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Collection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"itemType"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sharedWith"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"referenceID"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"propertyID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Codelist"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"referenceID"}},{"kind":"Field","name":{"kind":"Name","value":"codesets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ontology"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"codes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"containerHierarchy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Phenotype"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"referenceID"}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"propertyID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"codelists"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"containerHierarchy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetCollectionQuery, GetCollectionQueryVariables>;
export const UpdateCollectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateCollection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"collectionID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"properties"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PropertyValueInput"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"referenceID"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ownerID"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locked"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"collectionID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"collectionID"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"Argument","name":{"kind":"Name","value":"properties"},"value":{"kind":"Variable","name":{"kind":"Name","value":"properties"}}},{"kind":"Argument","name":{"kind":"Name","value":"referenceID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"referenceID"}}},{"kind":"Argument","name":{"kind":"Name","value":"ownerID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ownerID"}}},{"kind":"Argument","name":{"kind":"Name","value":"locked"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locked"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ColectionFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ColectionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Collection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"itemType"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sharedWith"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"referenceID"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"propertyID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Codelist"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"referenceID"}},{"kind":"Field","name":{"kind":"Name","value":"codesets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ontology"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"codes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"containerHierarchy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Phenotype"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"referenceID"}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"propertyID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"codelists"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"containerHierarchy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdateCollectionMutation, UpdateCollectionMutationVariables>;
export const GetOntologiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getOntologies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ontologies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"rootCodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"numberOfChildren"}},{"kind":"Field","name":{"kind":"Name","value":"lastDescendantId"}}]}}]}}]}}]} as unknown as DocumentNode<GetOntologiesQuery, GetOntologiesQueryVariables>;
export const FetchOntologyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"fetchOntology"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startCursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ontology"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"rootCodes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"startCursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startCursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"numberOfChildren"}},{"kind":"Field","name":{"kind":"Name","value":"lastDescendantId"}},{"kind":"Field","name":{"kind":"Name","value":"path"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"children"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"numberOfChildren"}},{"kind":"Field","name":{"kind":"Name","value":"lastDescendantId"}},{"kind":"Field","name":{"kind":"Name","value":"path"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<FetchOntologyQuery, FetchOntologyQueryVariables>;
export const GetCodeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getCode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"codeID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startCursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"codeID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"numberOfChildren"}},{"kind":"Field","name":{"kind":"Name","value":"lastDescendantId"}},{"kind":"Field","name":{"kind":"Name","value":"path"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"children"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"startCursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startCursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"numberOfChildren"}},{"kind":"Field","name":{"kind":"Name","value":"lastDescendantId"}},{"kind":"Field","name":{"kind":"Name","value":"path"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetCodeQuery, GetCodeQueryVariables>;
export const GetCodesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getCodes"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"codeIDs"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"codes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"codeIDs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"numberOfChildren"}},{"kind":"Field","name":{"kind":"Name","value":"lastDescendantId"}},{"kind":"Field","name":{"kind":"Name","value":"path"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"children"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"numberOfChildren"}},{"kind":"Field","name":{"kind":"Name","value":"lastDescendantId"}},{"kind":"Field","name":{"kind":"Name","value":"path"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetCodesQuery, GetCodesQueryVariables>;
export const SearchCodesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"searchCodes"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ontologyID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"QueryData"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchCodes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ontologyID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ontologyID"}}},{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"numberOfChildren"}},{"kind":"Field","name":{"kind":"Name","value":"lastDescendantId"}},{"kind":"Field","name":{"kind":"Name","value":"path"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"children"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"numberOfChildren"}},{"kind":"Field","name":{"kind":"Name","value":"lastDescendantId"}},{"kind":"Field","name":{"kind":"Name","value":"path"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SearchCodesQuery, SearchCodesQueryVariables>;
export const StoreTransientChangesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"storeTransientChanges"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"codelistID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"changes"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChangesetInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storeTransientChanges"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"codelistID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"codelistID"}}},{"kind":"Argument","name":{"kind":"Name","value":"changes"},"value":{"kind":"Variable","name":{"kind":"Name","value":"changes"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CodelistFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CodelistFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Codelist"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"containerHierarchy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transientCodesets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ontology"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"codes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"codesets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ontology"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"codes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<StoreTransientChangesMutation, StoreTransientChangesMutationVariables>;
export const DiscardTransientChangesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"discardTransientChanges"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"codelistID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"discardTransientChanges"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"codelistID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"codelistID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CodelistFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CodelistFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Codelist"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"containerHierarchy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transientCodesets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ontology"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"codes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"codesets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ontology"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"codes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<DiscardTransientChangesMutation, DiscardTransientChangesMutationVariables>;
export const CommitChangesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"commitChanges"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"codelistID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"commit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CommitInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commitChanges"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"codelistID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"codelistID"}}},{"kind":"Argument","name":{"kind":"Name","value":"commit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"commit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CodelistFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CodelistFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Codelist"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"containerHierarchy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transientCodesets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ontology"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"codes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"codesets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ontology"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"codes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<CommitChangesMutation, CommitChangesMutationVariables>;
export const ImportCodelistsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"importCodelists"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"containerID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"codelists"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CodelistInput"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filename"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"importCodelists"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"containerID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"containerID"}}},{"kind":"Argument","name":{"kind":"Name","value":"codelists"},"value":{"kind":"Variable","name":{"kind":"Name","value":"codelists"}}},{"kind":"Argument","name":{"kind":"Name","value":"filename"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filename"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fully"}},{"kind":"Field","name":{"kind":"Name","value":"partially"}},{"kind":"Field","name":{"kind":"Name","value":"skipped"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reports"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"codelistName"}},{"kind":"Field","name":{"kind":"Name","value":"skipped"}},{"kind":"Field","name":{"kind":"Name","value":"partial"}},{"kind":"Field","name":{"kind":"Name","value":"report"}}]}}]}}]}}]} as unknown as DocumentNode<ImportCodelistsMutation, ImportCodelistsMutationVariables>;
export const SetCollectionPermissionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"setCollectionPermissions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"collectionID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"readerIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setCollectionPermissions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"collectionID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"collectionID"}}},{"kind":"Argument","name":{"kind":"Name","value":"readerIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"readerIds"}}}]}]}}]} as unknown as DocumentNode<SetCollectionPermissionsMutation, SetCollectionPermissionsMutationVariables>;
export const FetchPhenotypeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"fetchPhenotype"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"phenotypeID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"phenotype"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"phenotypeID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"phenotypeID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PhenotypeFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PhenotypeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Phenotype"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"medicalDescription"}},{"kind":"Field","name":{"kind":"Name","value":"operationalDescription"}},{"kind":"Field","name":{"kind":"Name","value":"referenceID"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"propertyID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"containerHierarchy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}},{"kind":"Field","name":{"kind":"Name","value":"codelists"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"codesets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ontology"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"codes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<FetchPhenotypeQuery, FetchPhenotypeQueryVariables>;
export const UpdatePhenotypeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updatePhenotype"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"phenotypeID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"position"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ReferencePosition"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"medicalDescription"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"operationalDescription"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"properties"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PropertyValueInput"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePhenotype"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"phenotypeID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"phenotypeID"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"position"},"value":{"kind":"Variable","name":{"kind":"Name","value":"position"}}},{"kind":"Argument","name":{"kind":"Name","value":"medicalDescription"},"value":{"kind":"Variable","name":{"kind":"Name","value":"medicalDescription"}}},{"kind":"Argument","name":{"kind":"Name","value":"operationalDescription"},"value":{"kind":"Variable","name":{"kind":"Name","value":"operationalDescription"}}},{"kind":"Argument","name":{"kind":"Name","value":"properties"},"value":{"kind":"Variable","name":{"kind":"Name","value":"properties"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PhenotypeFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PhenotypeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Phenotype"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"medicalDescription"}},{"kind":"Field","name":{"kind":"Name","value":"operationalDescription"}},{"kind":"Field","name":{"kind":"Name","value":"referenceID"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"propertyID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"containerHierarchy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}},{"kind":"Field","name":{"kind":"Name","value":"codelists"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ownerID"}},{"kind":"Field","name":{"kind":"Name","value":"codesets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ontology"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"codes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdatePhenotypeMutation, UpdatePhenotypeMutationVariables>;
export const GetPropertiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getProperties"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"clazz"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PropertyClass"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"properties"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"clazz"},"value":{"kind":"Variable","name":{"kind":"Name","value":"clazz"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"class"}},{"kind":"Field","name":{"kind":"Name","value":"dtype"}},{"kind":"Field","name":{"kind":"Name","value":"required"}},{"kind":"Field","name":{"kind":"Name","value":"readOnly"}},{"kind":"Field","name":{"kind":"Name","value":"options"}}]}}]}}]} as unknown as DocumentNode<GetPropertiesQuery, GetPropertiesQueryVariables>;
export const UpdateMeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateMe"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tutorialState"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMe"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"tutorialState"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tutorialState"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tutorialState"}}]}}]}}]} as unknown as DocumentNode<UpdateMeMutation, UpdateMeMutationVariables>;