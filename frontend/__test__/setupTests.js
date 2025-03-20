const nodeCrypto = require('crypto')
// import Enzyme from 'enzyme'
// import Adapter from '@wojtekmaj/enzyme-adapter-react-17'

// Enzyme.configure({adapter: new Adapter()})

window.crypto = {
  getRandomValues: function (buffer) {
    return nodeCrypto.randomFillSync(buffer)
  },
}

class TransformStream {}
window.TransformStream = TransformStream
