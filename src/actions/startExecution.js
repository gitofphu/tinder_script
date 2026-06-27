import { getElementByText } from '../utils/dom.js'
import { sleep } from '../utils/timing.js'
import { log } from '../utils/logger.js'
import { isAborted, resetAbort } from '../utils/abort.js'

const exploreList = [
    'Long-term partner',
    'Short-term fun',
    'New friends',
    'Non-monogamous',
    'Photo Verified',
    'Travel',
    'Music Mode',
    'Binge Watchers',
    'Sporty',
    'Date Night',
    'Thrill Seekers',
    'Creatives',
    'Foodies',
    'Nature Lovers',
    'Music Lovers',
    'Self Care',
    'Gamers',
    'Animal Parents',
]

async function loopingExplore(startAction, totalClicks) {
    log.loop('Starting loop explore...')

    for (const item of exploreList) {
        if (isAborted()) return

        log.event(`Processing explore: "${item}"`)

        const itemBtn = getElementByText('div', item)
        if (!itemBtn) {
            log.warn(`Item button for "${item}" not found, skipping...`)
            continue
        }

        log.event(`Click: "${item}"`)
        itemBtn.click()
        log.sleep(2000)
        await sleep(2000)
        if (isAborted()) return

        await startAction(totalClicks)
        if (isAborted()) return

        log.loop(`Done with "${item}", moving to next explore...`)
    }

    log.loop('Loop explore finished!')
}

export function createStartExecution(startAction, maxExecutionCount = 3) {
    let executionCount = 1

    const startExecution = async (totalClicks = 100) => {
        resetAbort()

        log.loop(
            `Starting execution... (${executionCount}/${maxExecutionCount})`,
        )

        const path = window.location.pathname.split('/')

        if (path[2] === 'recs') {
            log.event('Mode: recs')
            await startAction(totalClicks)
        } else if (path[2] === 'explore') {
            log.event('Mode: explore')
            await loopingExplore(startAction, totalClicks)
        }

        const exploreBtn = getElementByText('a', 'Explore')
        if (!exploreBtn) {
            log.warn('Explore button not found, stopping...')
            return
        }

        executionCount++
        if (executionCount - 1 >= maxExecutionCount) {
            log.loop('Max execution count reached. Stopping.')
            executionCount = 0
            return
        }

        log.event('Click: Explore')
        exploreBtn.click()

        log.loop(
            `Execution ${executionCount - 1} done, waiting 5s before next...`,
        )

        setTimeout(() => {
            if (!isAborted()) startExecution(totalClicks)
        }, 5000)
    }

    return startExecution
}
