export type Schema = {
  elements: Element[]
}

export type Visibility = 'own' | 'shared' | 'public'

export type EnumValue = {
  label: string
  value: string
}

export type Element = {
  label: string
  name: string
  type: 'text' | 'number' | 'enum'
  // is the element an intrinsic property of an entity?
  // e.g. used_for is an intrinsic property of phenotypes, but visibility is not
  intrinsic: boolean
  enumValues?: EnumValue[]
}

export type Filter = {
  units: OpExpr[]
}

export type Expr = LiteralExpr | OpExpr | FieldExpr

export type FieldExpr = {
  type: 'field'
  value: string
}

export type OpExpr = {
  type: 'op'
  op: string
  exprs: Expr[]
}

export type LiteralExpr = {
  type: 'literal'
  valueType: LiteralType
  value: any
}

export type LiteralType = 'text' | 'number' | 'enum' | 'enumset' | 'boolean' | 'date' | 'datetime'
