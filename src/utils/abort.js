import { log } from './logger.js'

let aborted = false

export function isAborted() { return aborted }
export function abortScript() { aborted = true; log.error('Script stopped manually.') }
export function resetAbort() { aborted = false }
