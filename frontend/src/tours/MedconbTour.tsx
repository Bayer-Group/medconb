import {Tour, TourProps} from 'antd'
import {useEffect, useMemo, useState} from 'react'
import useTourState from '../useTourState'
import MarkdownDisplayComponent from '../components/MarkdownDisplayComponent'
import {isEmpty} from 'lodash'
import {useDispatch} from 'react-redux'
import {addListener} from '@reduxjs/toolkit'
import {openObject} from '../store/workspace'
import {useLocation} from 'react-router-dom'
import evaluate from './evaluate'
import {flushSync} from 'react-dom'
// import { addAppListener } from '../store/listenerMiddleware'

declare global {
  interface Window {
    __E2E: boolean
  }
}

const MedconbTour = ({onStart}: {onStart?: () => void}) => {
  const {tutorialState, updateTourState} = useTourState()
  const [spec, setSpec] = useState<any>(null)
  const [context, setContext] = useState<any>({})
  const dispatch = useDispatch()
  const location = useLocation()

  useEffect(() => {
    const unsubscribe = dispatch(
      addListener({
        actionCreator: openObject,
        effect: (action, api) => {
          console.log(action)
        },
      }),
    )
    return () => {
      dispatch(unsubscribe)
    }
  }, [])

  const tourId = useMemo(() => {
    if (window.__E2E) {
      return null
    }

    if (!tutorialState) {
      return null
    }

    if (isEmpty(tutorialState)) {
      return 'initialTour'
    }

    const welcomeSeen = tutorialState?.welcome?.complete === true

    if (!welcomeSeen) {
      return 'initialTour'
    }

    if (location.pathname.match(/\/(collection|phenotype|codeset)/)) {
      const openObjectSeen = tutorialState?.open_objects?.complete === true
      if (!openObjectSeen) {
        return 'OpenObject'
      }

      if (location.pathname.startsWith('/collection')) {
        const collectionDetailSeen = tutorialState?.collection_view?.complete === true
        if (!collectionDetailSeen) {
          return 'CollectionView'
        }
      }

      if (location.pathname.startsWith('/phenotype')) {
        const phenotypeDetailSeen = tutorialState?.phenotype_view?.complete === true
        if (!phenotypeDetailSeen) {
          return 'PhenotypeView'
        }
      }

      if (location.pathname.startsWith('/codeset')) {
        const ontologyViewerDetailSeen = tutorialState?.ontology_viewer?.complete === true
        if (!ontologyViewerDetailSeen) {
          return 'OntologyViewer'
        }
      }
    }

    if (location.pathname == '/') {
      const searchSeen = tutorialState?.search?.complete === true
      if (!searchSeen) {
        return 'Search'
      }
    }

    return null
  }, [tutorialState])

  useEffect(() => {
    if (!tourId) {
      return
    }

    const collectionType = location.pathname.startsWith('/collection/Phenotype')
      ? 'Phenotype'
      : location.pathname.startsWith('/collection/Codelist')
      ? 'Codelist'
      : ''

    import(`./${tourId}.yaml`).then((_content) => {
      flushSync(() => {
        setSpec(_content.default)
        setContext({
          collectionType,
          tutorialState,
        })
        onStart?.()
      })
    })
  }, [tourId])
  if (!spec || !tourId) return null
  return <WelcomeTour context={context} tutorialState={tutorialState} updateTourState={updateTourState} spec={spec} />
}

const WelcomeTour = ({
  spec,
  tutorialState,
  updateTourState,
  context,
}: {
  spec: any
  tutorialState: any
  updateTourState: any
  context: any
}) => {
  const TOUR_STEPS = spec.steps.map((step: any) => step.name.trim())

  const [internalTourState, setTourState] = useState({...tutorialState})

  const handleTourStepChange = (current: number) => {
    const newState = {
      ...(internalTourState ?? {}),
      [spec.name]: {
        ...(internalTourState?.[spec.name] ?? {}),
        steps: {
          ...(internalTourState?.[spec.name]?.steps ?? {}),
          [TOUR_STEPS[current - 1]]: true,
        },
      },
    }
    setTourState(newState)
  }

  const handleTourClose = async () => {
    const newState = {
      ...internalTourState,
      [spec.name]: {
        ...internalTourState[spec.name],
        complete: true,
      },
    }
    setTourState(newState)

    await updateTourState(newState)
  }

  const steps: TourProps['steps'] = spec.steps.map((step: any) => ({
    title: step.title,
    description: <MarkdownDisplayComponent text={evaluate(step.description, context)} />,
    target: () => {
      if (step.target) return document.querySelector(`[data-tour-target="${step.target}"]`)
      return null
    },
    placement: step.placement,
  }))

  return <Tour key={spec.name} open onChange={handleTourStepChange} onClose={handleTourClose} steps={steps} />
}

export default MedconbTour
