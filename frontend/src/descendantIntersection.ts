import {inRange} from 'lodash'
import {IntermediateType, LocalCode} from '..'

const descendantIntersection = (code: LocalCode, codes: Set<number>): IntermediateType => {
  let included = 0
  const totalDescendants = code.last_descendant_id - code.id

  for (let i = code.id + 1; i <= code.last_descendant_id; i++) {
    if (!codes.has(i)) {
      if (included > 0) {
        return 'PARTIAL'
      }
    } else {
      included++
    }
  }
  if (included === 0) return 'NONE'
  if (included === totalDescendants) return 'FULL'
  return 'PARTIAL'
}

export default descendantIntersection
