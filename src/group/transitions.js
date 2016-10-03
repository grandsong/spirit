import List from '../list/list'
import Transition from './transition'

class Transitions extends List {

  duplicates = { prop: 'frame' }

  constructor(transitions) {
    super(transitions, Transition, [0])
  }

  /**
   * Get a transition by frame
   * @param {number} frame
   */
  get(frame) {
    return this._list.find(p => p.frame === frame)
  }
}

export default Transitions
