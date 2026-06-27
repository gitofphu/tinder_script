import { createStartAction } from './actions/startAction.js'
import { createStartExecution } from './actions/startExecution.js'

const MAX_EXECUTION_COUNT = 3
const TOTAL_CLICKS = 1000

const startAction = createStartAction()
const startExecution = createStartExecution(startAction, MAX_EXECUTION_COUNT)

startExecution(TOTAL_CLICKS)
window.startExecution = startExecution
