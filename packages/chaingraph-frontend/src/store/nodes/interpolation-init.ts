import { updateNodePositionInterpolated } from './events'
import { positionInterpolator } from './position-interpolation'

// Initialize interpolator update handler
positionInterpolator.onUpdate = (nodeId, position) => {
  updateNodePositionInterpolated({
    nodeId,
    position,
  })
}
