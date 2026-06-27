import { createStartAction } from './actions/startAction.js'
import { createStartExecution } from './actions/startExecution.js'

const startAction = createStartAction()
const startExecution = createStartExecution(startAction, 3)

startExecution(1000)
window.startExecution = startExecution
