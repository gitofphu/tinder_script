import { getElementByText } from '../utils/dom.js'
import { sleep } from '../utils/timing.js'
import { log } from '../utils/logger.js'

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

async function loopingExplore(startAction) {
    log.loop('Starting loop explore...')

    for (const item of exploreList) {
        log.event(`Processing explore: "${item}"`)

        const itemBtn = getElementByText('div', item)
        if (!itemBtn) {
            log.warn(`Item button for "${item}" not found, skipping...`)
            continue
        }
        log.loop(`Done with "${item}", moving to next explore...`)

        itemBtn.click()
        log.sleep(2000)
        await sleep(2000)
        await startAction()
    }

    log.loop('Loop explore finished!')
}

export function createStartExecution(startAction, maxExecutionCount = 3) {
    let executionCount = 0

    const startExecution = async () => {
        log.loop(
            `Starting execution... (${executionCount}/${maxExecutionCount})`,
        )

        const path = window.location.pathname.split('/')

        if (path[2] === 'recs') {
            log.event('Mode: recs')
            await startAction()
        } else if (path[2] === 'explore') {
            log.event('Mode: explore')
            await loopingExplore(startAction)
        }

        const exploreBtn = getElementByText('a', 'Explore')
        if (!exploreBtn) {
            log.warn('Explore button not found, stopping...')
            return
        }

        executionCount++
        if (executionCount >= maxExecutionCount) {
            log.loop('Max execution count reached. Stopping.')
            return
        }

        exploreBtn.click()

        log.loop(`Execution ${executionCount} done, waiting 5s before next...`)

        setTimeout(startExecution, 5000)
    }

    return startExecution
}
