import {find} from 'lodash'
import {Element, FieldExpr, Filter, LiteralExpr, LiteralType, Schema} from '.'

type OpItem = {
  op: string
  resultType: LiteralType
  exprTypes: LiteralType[]
}

const opItems: OpItem[] = [
  {op: 'is', resultType: 'boolean', exprTypes: ['text', 'text']},
  {op: 'is', resultType: 'boolean', exprTypes: ['number', 'number']},
  {op: 'is', resultType: 'boolean', exprTypes: ['enum', 'enumset']}, // allow multi select in case of enum, renders checkboxes instead of radio
  {op: 'is', resultType: 'boolean', exprTypes: ['date', 'date']},
  {op: 'is', resultType: 'boolean', exprTypes: ['datetime', 'datetime']},

  // todo: text matches, contains, startswith, endswith, and so on.... ?
  // todo: number >, <, >=, <= , and so on.... ?

  {op: 'is not', resultType: 'boolean', exprTypes: ['text', 'text']},
  {op: 'is not', resultType: 'boolean', exprTypes: ['number', 'number']},
  {op: 'is not', resultType: 'boolean', exprTypes: ['enum', 'enumset']}, // allow multi select in case of enum, renders checkboxes instead of radio
  {op: 'is not', resultType: 'boolean', exprTypes: ['date', 'date']},
  {op: 'is not', resultType: 'boolean', exprTypes: ['datetime', 'datetime']},
]

for (const type of ['text', 'number', 'enum', 'enumset', 'boolean', 'date', 'datetime'] as LiteralType[]) {
  opItems.push({op: 'is empty', resultType: 'boolean', exprTypes: [type]})
  opItems.push({op: 'is not empty', resultType: 'boolean', exprTypes: [type]})
}

/*

const filter: Filter = {
  units: [
    {
      type: 'op',
      op: 'is',
      exprs: [
        {type: 'field', value: 'visibility'},
        {type: 'literal', valueType: 'enumset', value: ['Own', 'Shared']},
      ],
    },
  ],
}

*/

// bypass result type as we are always looking for boolean result
// LHS is always field expression for now
const findMatchingOpItems = (schema: Schema, options: {lhs: FieldExpr}): OpItem[] => {
  return opItems.filter((item) => {
    const field = find(schema.elements, {name: options.lhs.value})
    if (field?.type) {
      if (item.exprTypes[0] === null) {
        // what?
        return false
      }

      if (item.exprTypes[0] != null && item.exprTypes[0] !== field.type) {
        return false
      }

      // non intrinsic property cannot be used in expressions that only require one expressions
      // e.g. is empty | is not empty
      if (item.exprTypes.length == 1 && !field.intrinsic) {
        return false
      }
    }

    return true
  })
}

const findFieldByName = (schema: Schema, name: string): Element => {
  const element = find(schema.elements, {name})
  if (!element) {
    throw new Error(`Element with name ${name} does not exist`)
  }

  return element
}

const compileFilters = (schema: Schema, filter: Filter): string => {
  const mapper = compileFilter(schema)
  const filters = filter.units.map(mapper)
  return filters.join(' ') // todo: join with and?
}

const compileFilter =
  (schema: Schema) =>
  (unit: Filter['units'][number]): string => {
    const element = findFieldByName(schema, (unit.exprs[0] as FieldExpr).value)

    const parts = [`${element.name}`]

    if (unit.exprs.length > 1) {
      const expr = unit.exprs[1] as LiteralExpr
      switch (expr.valueType) {
        case 'text':
        case 'number': {
          parts.push(expr.value)
          break
        }
        case 'enumset': {
          parts.push(expr.value.join(','))
          break
        }
        default:
          throw new Error(`Value type ${expr.valueType} not implemented yet.`)
      }
    }

    return parts.join(':')
  }

export {compileFilters, findMatchingOpItems, findFieldByName}
