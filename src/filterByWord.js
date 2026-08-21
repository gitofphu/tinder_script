import { createStartLikeAction } from './actions/startLikeAction.js'
import { createStartExecution } from './actions/startExecution.js'
import { abortScript } from './utils/abort.js'

const MAX_EXECUTION_COUNT = 4
const TOTAL_CLICKS = 1000

const startLikeAction = createStartLikeAction()
const startExecution = createStartExecution(startLikeAction)

startExecution(TOTAL_CLICKS, MAX_EXECUTION_COUNT)
window.startExecution = startExecution
window.stopScript = abortScript
