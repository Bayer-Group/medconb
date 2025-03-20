import {styled} from '@linaria/react'
import PropertiesEditor from './PropertiesEditor'

export {PropertiesEditor}

export const PropertiesRoot = styled.div`
  margin-bottom: 8px;
`

export const PropertyContainer = styled.div`
  padding: 0 4px;
  /* cursor: pointer; */
  display: flex;
  align-self: center;
  align-items: center;
  height: 100%;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    border-color: transparent;
  }

  a {
    color: initial;
    &:hover {
      color: initial;
    }
  }
`

export const PropertyRow = styled.div`
  display: grid;
  grid-template-columns: 24px 120px 1fr;
  grid-column-gap: 8px;
  align-items: center;

  .property {
    grid-area: 1 / 2 / 1 / 3;
    position: relative;
  }

  .remove {
    visibility: hidden;
    &.ant-btn,
    .anticon {
      transition: none;
    }
  }

  &.invalid {
    > .property::after {
      content: '';
      position: absolute;
      top: 0;
      inset-inline-start: 0;
      transform: translate(-50%, 50%);
      transform-origin: 0% 0%;
      height: 6px;
      width: 6px;
      background-color: rgb(255, 77, 79);
      border-radius: 100%;
    }
  }

  &:hover:not(.readonly) {
    & > .remove {
      visibility: visible;
    }
  }
`

export const PropertyLabel = styled.div``
