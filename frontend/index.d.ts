export type CollectionItem = Codelist | Phenotype

export type IntermediateType = 'FULL' | 'PARTIAL' | 'NONE'

export type ApplicationConfig = {
  graphql_endpoints: string[]
  show_version: boolean
  dev_token: ?string
  msal: {
    auth: {
      clientId: string
      authority: string
      redirectUri: string
    }
    scopes: string[]
  }
  logStreamPrefix: string
  aws: {
    accessKeyId: string
    secretAccessKey: string
    region: string
    logGroupName: string
  }
  maintenance_mode: boolean
  glitchtipDSN: string
  i18n: {
    companyName: string
    feedbackEmail: string
    [key: string]: string
  }
}

export type Collection = {
  id: string
  name: string
  itemType: 'Phenotype' | 'Codelist'
  sharedWith: string[]
  items: CollectionItem[]
  description: string
  visibility: 'Public' | 'Private' | 'Shared'
}

export type PropertyDataType = 'Text' | 'Number' | 'Enum' | 'Time' | 'User'

export type Property = {
  id: number
  name: string
  class: 'Phenotype' | 'Collection'
  dtype: PropertyDataType
  required?: boolean
  readOnly?: boolean

  // "If dtype is Enum this lists all valid options."
  options?: string[]
}

export type PropertyValue = {
  propertyID?: number
  name: string
  value: string | null
}

export type Phenotype = {
  id: string
  name: string
  referenceID?: string
  medicalDescription: string
  operationalDescription: string
  codelists: Codelist[]
  properties: PropertyValue[]
  containerHierarchy: ContainerSpec[]
}

export type LocalCode = {
  id: number
  code: string
  ontology_id: string
  description: string
  path: number[]
  children_ids: number[]
  last_descendant_id: number
}

export type LocalOntology = {
  name: string
  root_code_ids: number[]
}

export type CodeTreeData = {
  [mcId: string]: string[]
}

export type CodeTreeDataSet = {
  [mcId: string]: Set<number>
}

export type Code = {
  id: string
  code: string
  description: string
  path: Code[]
  children?: Code[]
  numberOfChildren: number
  lastDescendantId: number
}

export type Ontology = {
  name: string
  rootCodes: Code[]
}

export type CodeSet = {
  ontology: Ontology
  codes: Code[]
}

export type ContainerSpec = {
  id: string
  type: 'Collection' | 'Phenotype'
  name: string
  visibility?: 'Private' | 'Public' | 'Shared'
}

export type Codelist = {
  id: string
  name: string
  referenceID?: string
  description: string
  codesets: CodeSet[]
  transientCodesets: CodeSet[]
  containerHierarchy: ContainerSpec[]
}

export type IndicatorIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20

export type CodesetInput = {
  ontologyID: string
  codes: string[]
}

export type CodelistInput = {
  name: string
  codesets: CodesetInput[]
}

export type ImportCodelistPayload = {
  containerID: string
  codelists: MedicalConceptInput[]
}

export type SearchResult = {
  id: string
  path: {id: string}[]
  numberOfChildren: number
  code: string
  description: string
  lastDescendantId: number
}

export type User = {
  id: string
  externalId: string
  name: string
}

export type Property = {
  class: 'Phenotype' | 'Collection'
  dType: 'Text' | 'Number' | 'Enum'
  id: number
  options?: string[]
  required: boolean
  name: string
}

export type PropertyValue = {
  propertyID: number
  name: string
  value: sring
}
