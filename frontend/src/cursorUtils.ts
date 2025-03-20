// https://stackoverflow.com/a/70800591/876117
function getCursorPosition(parent: any, node: any, offset: any, stat: any) {
  if (stat.done) return stat

  let currentNode = null
  if (parent.childNodes.length == 0) {
    stat.pos += parent.textContent.length
  } else {
    for (let i = 0; i < parent.childNodes.length && !stat.done; i++) {
      currentNode = parent.childNodes[i]
      if (currentNode === node) {
        stat.pos += offset
        stat.done = true
        return stat
      } else getCursorPosition(currentNode, node, offset, stat)
    }
  }
  return stat
}

//find the child node and relative position and set it on range
function setCursorPosition(parent: any, range: any, stat: any) {
  if (stat.done) return range

  let currentNode = null

  if (parent.childNodes.length == 0) {
    if (parent.textContent.length >= stat.pos) {
      range.setStart(parent, stat.pos)
      stat.done = true
    } else {
      stat.pos = stat.pos - parent.textContent.length
    }
  } else {
    for (let i = 0; i < parent.childNodes.length && !stat.done; i++) {
      currentNode = parent.childNodes[i]
      setCursorPosition(currentNode, range, stat)
    }
  }
  return range
}

export {getCursorPosition, setCursorPosition}
