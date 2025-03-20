import {styled} from '@linaria/react'
import React from 'react'
import Icon from '@ant-design/icons'
import {TickIcon} from '../customIcons'

type CheckboxProps = {
  checked?: boolean
  onChange: (checked: boolean) => void
  indeterminate?: boolean
}

const Checkbox: React.FC<CheckboxProps> = ({checked = false, onChange, indeterminate = false}) => {
  return (
    <Root
      // intermediate={intermediate}
      checked={checked}
      onClick={() => onChange(!checked)}>
      {checked && <Icon component={() => <TickIcon />} />}
    </Root>
  )
}

export default Checkbox

const Root = styled.div<{checked: boolean}>`
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: ${(props) => (props.checked ? '#10384f' : '#fff')};
  border: 1px solid #10384f;
  cursor: pointer;
  text-align: center;
  margin: 0 3px;
  /* font-size: 12px; */
  display: flex;
  align-items: center;
  justify-content: center;
`
