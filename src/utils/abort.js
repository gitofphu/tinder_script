let aborted = false

export function isAborted() { return aborted }
export function abortScript() { aborted = true }
export function resetAbort() { aborted = false }
