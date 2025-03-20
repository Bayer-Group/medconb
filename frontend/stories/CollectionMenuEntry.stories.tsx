import React, {useState} from 'react'
import CollectionMenuEntry from '../src/components/MenuEntry'

export default {
  component: CollectionMenuEntry,
  title: 'CollectionMenuEntry',
}

const Template = (args: any) => {
  const {value, onRename, ...rest} = args
  const [textValue, setValue] = useState(value)
  return (
    <div style={{width: 300}}>
      <CollectionMenuEntry value={textValue} onRename={(newName) => setValue(newName)} {...rest} />
    </div>
  )
}

export const Default = Template.bind({})

Default.args = {
  value: 'Unnamed Collection',
}
