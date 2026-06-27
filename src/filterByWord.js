import { createStartAction } from './actions/startAction.js'
import { createStartExecution } from './actions/startExecution.js'

const startAction = createStartAction()
const startExecution = createStartExecution(startAction)

startExecution()
window.startExecution = startExecution
