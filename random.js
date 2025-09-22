// SETTINGS
const totalClicks = 20000 // total actions to perform
const minDelay = 500 // minimum delay in ms
const maxDelay = 1000 // maximum delay in ms

let clicksDone = 0
let retryCount = 0

function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function findButtonByText(text) {
    return Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent.trim() === text
    )
}

function clickRandomButton() {
    const rand = Math.random() * 100
    let action = ''

    if (rand < 90) {
        action = 'Like' // 90% chance
    } else if (rand < 97) {
        action = 'Nope' // 8% chance
    } else {
        action = 'Rewind' // 2% chance
    }

    const btn = findButtonByText(action)

    if (retryCount > 3) {
        console.error(`Too many retries. Stopping.`)
        clicksDone = 0
        retryCount = 0
        return
    }

    if (
        !btn ||
        (['Like', 'Nope'].includes(action) &&
            btn.getAttribute('aria-disabled') === 'true')
    ) {
        retryCount++
        const delay = randomDelay(minDelay, maxDelay)
        console.error(`Button for action "${action}" not found!`)
        setTimeout(clickRandomButton, delay)
        return
    }

    btn.click()
    clicksDone++
    console.log(`Action: ${action} (${clicksDone}/${totalClicks})`)

    if (clicksDone < totalClicks) {
        const delay = randomDelay(minDelay, maxDelay)
        console.log(`Waiting for ${delay} ms before next action...`)
        setTimeout(clickRandomButton, delay)
    } else {
        console.log('Finished all actions.')
        clicksDone = 0
    }
}

// Start
clickRandomButton()
