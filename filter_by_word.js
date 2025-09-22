// SETTINGS
const totalClicks = 500 // total actions to perform
const minDelay = 500 // minimum delay in ms
const maxDelay = 1000 // maximum delay in ms

let clicksDone = 0
let retryCount = 0

const bannedWords = [
    'ladyboy',
    'กระเทย',
    'single mon',
    'เกย์',
    'ชายแท้',
    'สาวสอง',
    'gay',
]

function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function getElementByText(tag, text) {
    return Array.from(document.querySelectorAll(tag)).find(
        item => item.textContent.trim() === text
    )
}

function clickNopeButton(nopeBtn, reason, delay) {
    nopeBtn.click()
    clicksDone++
    console.info(reason)
    setTimeout(startAction, delay)
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function startAction() {
    const profileBtn = getElementByText('button', 'Open Profile')

    if (!profileBtn) {
        clicksDone = 0
        throw new Error('Profile button not found')
    }

    profileBtn.click()

    await sleep(500)

    const nopeBtn = getElementByText('button', 'Nope')
    const likeBtn = getElementByText('button', 'Like')
    const delay = randomDelay(minDelay, maxDelay)

    let aboutMe = getElementByText('div', 'About me')?.nextElementSibling
        ?.textContent

    if (aboutMe) {
        console.log('aboutMe:', aboutMe)

        const foundBannedWords = bannedWords.filter(word =>
            aboutMe
                .toLowerCase()
                .replace(/\s+/g, '')
                .includes(word.toLowerCase())
        )

        console.log('foundBannedWords:', foundBannedWords)

        if (foundBannedWords.length) {
            return clickNopeButton(
                nopeBtn,
                `Nope due to banned words: ${foundBannedWords.join(
                    ', '
                )} (${clicksDone}/${totalClicks})`,
                delay
            )
        }
    }

    const haveChildren = getElementByText('h3', 'Family Plans')
        ?.nextElementSibling?.textContent?.toLowerCase()
        ?.includes('i have children')

    console.log('haveChildren:', haveChildren)

    if (haveChildren) {
        return clickNopeButton(
            nopeBtn,
            `Nope due to having children (${clicksDone}/${totalClicks})`,
            delay
        )
    }

    likeBtn.click()
    clicksDone++
    console.log(`Liked (${clicksDone}/${totalClicks})`)

    if (clicksDone < totalClicks) {
        console.log(`Waiting for ${delay} ms before next action...`)
        setTimeout(startAction, delay)
    } else {
        console.log('Finished all actions.')
        clicksDone = 0
    }
}

startAction()
