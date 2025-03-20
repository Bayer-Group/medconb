import React from 'react'
import MedicalConceptSummary from '../src/CodeListSummary'

export default {
  component: MedicalConceptSummary,
  title: 'MedicalConceptSummary',
}

const Template = (args: any) => {
  return (
    <div style={{width: 355, border: '1px solid #000', padding: 15, background: '#F0F2F5', minHeight: 400}}>
      <MedicalConceptSummary {...args} />
    </div>
  )
}

export const Default = Template.bind({})

Default.args = {}
