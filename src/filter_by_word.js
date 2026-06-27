import { createStartAction } from './actions/startAction.js'

const startAction = createStartAction()

window.startAction = startAction
startAction()
