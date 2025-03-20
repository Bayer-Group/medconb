import { useParams} from 'react-router-dom'

const withRouteParam = <P extends Object>(Component: React.ComponentType<P>): React.FC<Omit<P, 'id'>> => {
  return (props: Omit<P, 'id'>) => {
    const {id} = useParams()
    return <Component {...(props as P)} id={id} />
  }
}

export default withRouteParam
