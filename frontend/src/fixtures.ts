export const phenotypes = [
  {
    id: 'e0b138fe-b2db-4435-b3db-fbce83f5459e',
    name: 'Diabetes',
    children: [],
    __typename: 'Phenotype',
  },
  {
    id: '60f59254-2fe3-4985-b7f2-de4599753c84',
    name: 'Death',
    children: [],
    __typename: 'Phenotype',
  },
  {
    id: 'e27c7222-2ffc-4204-bf0a-12d9ac0d976d',
    name: 'Heart Failure',
    children: [],
    __typename: 'Phenotype',
  },
]

export const studiesData = [
  {
    id: '89a2fe3b-db72-495d-931b-62f1f1efc062',
    name: 'Thrombosis Library',
    type: 'collection',
    phenotypes: [phenotypes[0]],
    properties: [],
    __typename: 'PhenoCollection',
  },
  {
    id: '0b471d5c-2314-4b81-ace5-b2696fa9b3ce',
    name: 'Flieder',
    type: 'collection',
    properties: [],
    phenotypes: [phenotypes[1], phenotypes[0], phenotypes[2]],
    __typename: 'PhenoCollection',
  },
  {
    id: 'a3e794f2-2915-417c-a721-5ceeb7b13d62',
    name: 'Factor XI',
    type: 'collection',
    properties: [],
    phenotypes: [],
    __typename: 'PhenoCollection',
  },
  {
    id: 'dd94d630-ba02-4514-80de-e39aca71ed70',
    name: 'Stork CKD',
    type: 'collection',
    properties: [],
    phenotypes: [],
    __typename: 'PhenoCollection',
  },
]
