import {CaretDownFilled, CaretRightFilled} from '@ant-design/icons'
import {styled} from '@linaria/react'
import {Avatar, Badge, Button, ButtonProps, Space, Typography} from 'antd'
import contentEditable from './contentEditable'
import {PropsWithChildren} from 'react'

export const Section = styled.div`
  /* border-bottom: 1px solid #d9d9d9; */
  display: flex;
  flex-direction: column;
`

export const Title = styled.div`
  display: block;
  flex: 1;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 11px;
  letter-spacing: 1px;
  span {
    border-radius: 4px;
    padding: 2px;
    &:hover {
      background-color: #ddd;
    }
  }
`

export const SubTitle = styled.div`
  display: block;
  flex: 1;
  text-transform: uppercase;
  font-weight: 400;
  font-size: 10px;
`

export const Headline = styled.div`
  display: flex;
  padding: 8px 0;
  align-items: center;
  position: sticky;
  bottom: 0;
  cursor: pointer;
  // margin-bottom: 6px;

  ${Title} {
    margin-left: 8px;
    font-size: 10px;
  }

  .ant-btn-icon-only.ant-btn-sm {
    height: 20px;
    font-size: 10px;
    width: 20px;
  }

  .ant-btn-icon-only.ant-btn-sm .anticon-caret-right {
    font-size: 10px;
  }
`

export const ToggleIcon: React.FC<{isOpen: boolean} & ButtonProps> = ({isOpen, ...props}) => {
  return <ToggleIconBase {...props} style={{transform: `rotate(${isOpen ? 90 : 0}deg`}} />
}

export const ToggleIconBase = styled(Button)`
  transition: transform linear 0.1s;

  .ant-btn-icon-only.ant-btn-sm {
    height: 20px;
    font-size: 10px;
    width: 20px;
  }

  .ant-btn-icon-only.ant-btn-sm .anticon-caret-right {
    font-size: 10px;
  }
`

export const Count = styled.span`
  background: #f1faff;
  color: #000;
  margin-left: 4px;
  padding: 0 4px;
  display: inline-block;
  border-radius: 2px;
`

export const ChangedCount = styled(Count)`
  color: #d4380d;
  background: #fff1f0;
  padding-left: 14px;
  position: relative;

  &:before {
    content: '';
    border-radius: 4px;
    height: 6px;
    width: 6px;
    background: #d4380d;
    position: absolute;
    top: 4px;
    left: 4px;
  }
`

export const ToggleButton: React.FC<{isOpen: boolean} & ButtonProps> = ({isOpen, ...props}) => {
  return (
    <Button
      icon={isOpen ? <CaretDownFilled /> : <CaretRightFilled />}
      {...props}
      style={{opacity: isOpen ? 1 : 0.5, fontSize: 10, letterSpacing: 1, fontWeight: 'bold'}}
    />
  )
}

export const MyBadge: React.FC<{isValid: boolean} & PropsWithChildren> = ({isValid, children}) => {
  return isValid ? (
    children
  ) : (
    <Badge dot offset={[-8, 6]}>
      {children}
    </Badge>
  )
}

export const ToggleButtonPlain: React.FC<ButtonProps> = (props) => {
  return <Button {...props} style={{fontSize: 10, letterSpacing: 1, fontWeight: 'bold', opacity: 0.5}} />
}

ToggleButton.defaultProps = {
  size: 'small',
  type: 'text',
}
ToggleButtonPlain.defaultProps = {
  size: 'small',
  type: 'text',
}

export const ContainerTypeIndicator = styled(Avatar)`
  line-height: 1.2em;
  height: 1.2em;
  width: 1.2em;
  vertical-align: middle;
  font-size: 11px;
`

export const EditableTitle = contentEditable(Typography.Title)

export const EditableP = contentEditable(styled.p`
  border: 1px solid transparent;
  margin: 0;
  box-sizing: border-box;
  line-height: 1.75;
  font-size: 12px;
  /* text-overflow: ellipsis; */
  white-space: nowrap;
  overflow: hidden;
  width: 100%;
  min-height: 20px;
`)

export const TableTitleSpace = styled(Space)`
  .ant-btn.ant-btn-sm {
    border-radius: 16px;
  }
`

export const CircleToggleButton: React.FC<
  {isActive?: boolean; onChange?: (active: boolean) => void} & Omit<ButtonProps, 'onChange'>
> = ({isActive = false, onChange, ...props}) => {
  return (
    <Button
      {...props}
      type="primary"
      shape="circle"
      onClick={() => onChange?.(!isActive)}
      size="small"
      style={{
        opacity: isActive ? 1 : 0.5,
        background: '#595959',
        ...(props.size === 'small' && {
          cursor: 'default',
          lineHeight: 1,
          fontSize: 9,
          height: 14,
          minWidth: 14,
          width: 14,
        }),
        ...props.style,
      }}
    />
  )
}
// style={{cursor: 'default', lineHeight: 1, fontSize: 9, height: 14, minWidth: 14, width: 14, ...props.style}}
