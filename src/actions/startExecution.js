import { getElementByText } from '../utils/dom.js'
import { sleep } from '../utils/timing.js'

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

async function looping(startAction) {
    console.log('Starting loop...')

    for (const item of exploreList) {
        console.log(`Processing item: ${item}`)

        const itemBtn = getElementByText('div', item)
        if (!itemBtn) {
            console.log(`Item button for "${item}" not found`)
            continue
        }
        itemBtn.click()
        await sleep(2000)
        await startAction()
    }

    console.log('Loop finished!')
}

export function createStartExecution(startAction, maxExecutionCount = 3) {
    let executionCount = 0

    const startExecution = async () => {
        console.log(
            `Starting execution... (Execution count: ${executionCount}/${maxExecutionCount})`,
        )

        const path = window.location.pathname.split('/')

        if (path[2] === 'recs') {
            console.log('Mode: recs')
            await startAction()
        } else if (path[2] === 'explore') {
            console.log('Mode: explore')
            await looping(startAction)
        }

        const exploreBtn = getElementByText('a', 'Explore')
        if (!exploreBtn) {
            console.log('exploreBtn not found, stopping...')
            return
        }

        executionCount++
        if (executionCount >= maxExecutionCount) {
            console.log('Execution count exceeded. Stopping execution.')
            return
        }

        exploreBtn.click()

        console.log(
            'execution finished, waiting for 5 seconds before starting the next action...',
        )

        setTimeout(startExecution, 5000)
    }

    return startExecution
}
