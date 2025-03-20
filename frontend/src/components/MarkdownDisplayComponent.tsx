import {styled} from '@linaria/react'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import slugify from 'slugify'
import {Col, Row} from 'antd'
import {HashLink} from 'react-router-hash-link'
import {floor, startsWith} from 'lodash'

const flatten = (text: string, child: any): any => {
  return typeof child === 'string' ? text + child : React.Children.toArray(child.props.children).reduce(flatten, text)
}

const AnchorRenderer = (props: any) => {
  const {children, ...rest} = props

  if (startsWith(props.href, '#')) {
    return (
      <HashLink to={props.href} replace>
        {children}
      </HashLink>
    )
  } else {
    return React.createElement('a', rest, children)
  }
}

const HeadingRenderer = (props: any) => {
  const children = React.Children.toArray(props.children)
  const text = children.reduce(flatten, '')
  const slug = slugify(text, {lower: true, remove: /[*+~.?()'"!:@]/g})
  return React.createElement('h' + props.level, {id: slug}, props.children)
}

type MarkdownDisplayComponentProps = {
  mdUri?: string
  text?: string
  margin?: number
  rootElem?: any
  variables?: Record<string, string>
}

const loadMarkdownContent = async (uri: string, variables: Record<string, string>): Promise<string> => {
  const response = await fetch(uri)
  if (!response.ok) {
    throw new Error(`Failed to fetch markdown content from ${uri}`)
  }
  const content = await response.text()
  return content.replace(/\${(.*?)}/g, (match, key) => variables[key] || match)
}

const MarkdownDisplayComponent: React.FC<MarkdownDisplayComponentProps> = ({
  mdUri,
  text,
  margin,
  rootElem,
  variables = {},
}) => {
  const [content, setContent] = React.useState<string>('ERROR: No content provided. Use `text` or `mdUri` prop.')

  if (text && text !== content) {
    setContent(text)
  } else if (mdUri) {
    React.useEffect(() => {
      void (async () => {
        setContent('Loading...')
        const content = await loadMarkdownContent(mdUri, variables)
        setContent(content)
      })()
    }, [mdUri])
  }

  margin = Math.abs(floor(margin || 0))
  margin = margin >= 12 ? 0 : margin

  const ThisRoot = rootElem || DefaultRoot

  return (
    <ThisRoot>
      <Row>
        <Col span={margin}></Col>
        <Col span={24 - 2 * margin}>
          <ReactMarkdown
            components={{
              h1: HeadingRenderer,
              h2: HeadingRenderer,
              h3: HeadingRenderer,
              h4: HeadingRenderer,
              h5: HeadingRenderer,
              h6: HeadingRenderer,
              a: AnchorRenderer,
            }}>
            {content}
          </ReactMarkdown>
        </Col>
        <Col span={margin}></Col>
      </Row>
    </ThisRoot>
  )
}

export default MarkdownDisplayComponent

const DefaultRoot = styled.div`
  img {
    max-width: 1300px;
  }
`
