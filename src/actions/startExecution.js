import { getElementByText, getTinderLayout, LAYOUT } from '../utils/dom.js'
import { sleep } from '../utils/timing.js'
import { log } from '../utils/logger.js'
import { isAborted, resetAbort } from '../utils/abort.js'
import { showToast } from '../utils/toast.js'

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

const MODE = Object.freeze({
    RECS: 'recs',
    EXPLORE: 'explore',
})

async function loopingExplore(startAction, totalClicks) {
    log.loop('Starting loop explore...')

    for (const item of exploreList) {
        if (isAborted()) return

        const backToExploreBtn = getElementByText('button', 'Back to Explore')
        if (backToExploreBtn) {
            log.info('Click: Back to Explore')
            backToExploreBtn.click()
            log.sleep(2000)
            await sleep(2000)
        }

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

    const backToExploreBtn = getElementByText('button', 'Back to Explore')
    if (backToExploreBtn) {
        log.info('Click: Back to Explore')
        backToExploreBtn.click()
        log.sleep(2000)
        await sleep(2000)
    }
}

export function createStartExecution(startAction) {
    let executionCount = 1
    let twoModeMaxExecutionCount = 0

    const startExecution = async (totalClicks = 100, maxExecutionCount = 3) => {
        if (twoModeMaxExecutionCount === 0) {
            twoModeMaxExecutionCount = maxExecutionCount * 2
        }

        log.info(
            'Starting execution with totalClicks:',
            totalClicks,
            'maxExecutionCount:',
            maxExecutionCount,
            ' twoModeMaxExecutionCount:',
            twoModeMaxExecutionCount,
        )
        resetAbort()

        log.loop(
            `Starting execution... (${executionCount}/${twoModeMaxExecutionCount})`,
        )

        const path = window.location.pathname.split('/')
        const modePath = path[2]

        if (modePath === MODE.RECS) {
            log.event('Mode: recs')
            await startAction(totalClicks)
        } else if (modePath === MODE.EXPLORE) {
            log.event('Mode: explore')
            await loopingExplore(startAction, totalClicks)
        }

        const exploreBtn = getElementByText('a', 'Explore')
        const tinderBtn = getElementByText('a', 'Tinder')
        if (!exploreBtn && !tinderBtn) {
            const msg =
                'Explore button and Tinder button not found, stopping execution.'
            log.warn(msg)
            showToast(msg)
            return
        }

        const layout = getTinderLayout()
        if (layout === LAYOUT.UNKNOWN) {
            const msg = 'Layout unknown. Stopping execution.'
            log.error(msg)
            showToast(msg)
            executionCount = 1
            return
        }

        const clickExplore = () => {
            log.event('Click: Explore')
            exploreBtn.click()
        }
        const clickTinder = () => {
            log.event('Click: Tinder')
            tinderBtn.click()
        }

        // Desktop keeps a single Explore toggle; mobile has separate nav buttons.
        if (layout === LAYOUT.DESKTOP) {
            clickExplore()
            if (modePath === MODE.RECS) {
                log.event('Change to explore mode')
            } else if (modePath === MODE.EXPLORE) {
                log.event('Change to Default mode')
            }
        } else if (modePath === MODE.RECS) {
            clickExplore()
            log.event('Change to explore mode')
        } else if (modePath === MODE.EXPLORE) {
            clickTinder()
            log.event('Change to Default mode')
        }

        log.loop(`Execution ${executionCount} done, waiting 5s before next...`)

        if (executionCount == twoModeMaxExecutionCount) {
            const msg = 'Max execution count reached. Stopping execution.'
            log.loop(msg)
            showToast(msg)
            executionCount = 1
            return
        }
        executionCount++

        setTimeout(() => {
            if (!isAborted()) startExecution(totalClicks, maxExecutionCount)
        }, 5000)
    }

    return startExecution
}
