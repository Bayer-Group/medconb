import React, {useState} from 'react'
import SelectOntology from '../src/components/SelectOntology'

export default {
  component: SelectOntology,
  title: 'Ontology Viewer Toolbar',
}

const Template = (args: any) => {
  const [ontology, setOntology] = useState({
    name: 'ICD-10',
    rootCodes: [{id: 1, code: 'A00', description: 'Certain Infectious'}],
  })
  return <SelectOntology {...args} value={ontology} onChange={setOntology} />
}

export const OntologySelector = Template.bind({})

OntologySelector.args = {
  ontologies: [
    {name: 'ICD-10', rootCodes: [{id: 1, code: 'A00', description: 'Certain Infectious'}]},
    {name: 'ICD-9', rootCodes: [{id: 1, code: 'A00', description: 'Certain Infectious'}]},
    {name: 'ICD-8', rootCodes: [{id: 1, code: 'A00', description: 'Certain Infectious'}]},
    {name: 'ICD-7', rootCodes: [{id: 1, code: 'A00', description: 'Certain Infectious'}]},
  ],
}
