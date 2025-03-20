import React from 'react'
import ConceptIndicator from '../src/components/ConceptIndicator'

export default {
  component: ConceptIndicator,
  title: 'ConceptIndicator',
}

const Template = (args: any) => <ConceptIndicator {...args} />

export const Default = Template.bind({})

Default.args = {
  index: 1,
}
