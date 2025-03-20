import React, {Suspense} from 'react'
import Icon from '@ant-design/icons'
import {styled} from '@linaria/react'
import {grey} from '@ant-design/colors'
import {IndicatorIndex} from '../..'
import useLazy from '../useLazy'

type ConceptIndicatorProps = {
  index: IndicatorIndex
  disabled?: boolean
  color: string
  onClick: () => void
  'aria-label'?: string
}

const ConceptIndicator: React.FC<ConceptIndicatorProps> = ({
  index,
  disabled = false,
  color,
  onClick,
  'aria-label': ariaLabel = 'Concept Indicator',
}) => {
  const Comp = useLazy(`Indicator_${index}`, () => import(`../../assets/icons/medcon_icons/icon_${index}.svg`))

  return (
    <Root $colorCode={color} $enabled={!disabled} onClick={onClick} aria-label={ariaLabel}>
      <Suspense fallback={<PlaceHolder />}>
        <Comp height="24px" width="24px" />
      </Suspense>
    </Root>
  )
}

export default ConceptIndicator

const PlaceHolder = styled.div`
  height: 22px;
  width: 22px;
`

// https://github.com/callstack/linaria/issues/806
const Root = styled.div<{$enabled: boolean; $colorCode: string}>`
  height: 24px;
  width: 24px;
  border: 0.5px solid ${(props) => (props.$enabled ? props.$colorCode : grey[0])};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  background: ${(props) => (props.$enabled ? props.$colorCode : '#fff')};

  svg path.stroke {
    fill: ${(props) => (props.$enabled ? '#000' : grey[0])};
  }
`
