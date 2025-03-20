import React, {useState} from 'react'
import EditableText from '../src/components/EditableText'

export default {
  component: EditableText,
  title: 'EditableText',
}

const Template = (args: any) => {
  const [textValue, setValue] = useState(args.value)
  return <EditableText value={textValue} onSave={(text) => setValue(text)} />
}

export const Default = Template.bind({})

Default.args = {
  value: 'Unnamed Collection',
}
