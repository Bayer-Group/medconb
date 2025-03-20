import { ButtonProps} from 'antd'
import {CircleToggleButton} from '../scratch'
import {ReactNode} from 'react'

type IconProps = {
  isActive?: boolean
  onChange?: (active: boolean) => void
  type: 'PhenotypeCollection' | 'CodelistCollection' | 'Phenotype' | 'Codelist'
} & Omit<ButtonProps, 'onChange' | 'type'>

const typeMap: {[type: string]: ReactNode} = {
  PhenotypeCollection: (
    <>
      C<sub>P</sub>
    </>
  ),
  CodelistCollection: (
    <>
      C<sub>L</sub>
    </>
  ),
  Phenotype: <>P</>,
  Codelist: <>L</>,
}

const colorMap = {
  PhenotypeCollection: '#FF7A45',
  CodelistCollection: '#FF7A45',
  Phenotype: '#FAAD14',
  Codelist: '13C2C2',
}

const EntityTypeIcon: React.FC<IconProps> = ({isActive, onChange, type, ...rest}) => {
  return (
    <CircleToggleButton onChange={onChange} isActive={isActive} style={{backgroundColor: colorMap[type]}} {...rest}>
      {typeMap[type]}
    </CircleToggleButton>
  )
}
export default EntityTypeIcon
