// SETTINGS
const totalClicks = 20000 // total actions to perform
const minDelay = 500 // minimum delay in ms
const maxDelay = 1000 // maximum delay in ms

let clicksDone = 0
let retryCount = 0

const bannedWords = [
    'ladyboy',
    'กระเทย',
    'singlemom',
    'singlemother',
    'เกย์',
    'ชายแท้',
    'สาวสอง',
    'gay',
    'transgender',
    'lgbt',
    'lgtv',
    'สาว2',
    'แม่เลี้ยงเดี่ยว',
    'notgirl',
    'notagirl',
    'ใช่ผู้หญิง',
    'ใช่ผญ',
    '🏳️‍🌈',
    'ลูก',
    'ไม่ใช่ผญ',
    'สาวส',
    '🏳️‍⚧️',
    'ข้ามเพศ',
    'แปลงเพศ',
    'notwoman',
    'notawoman',
    'ประเภท2',
    'ประเภทสอง',
    'ลูกติด',
    'trans',
    'ตุ๊ด',
    'ไม่ใช่ญแท้',
    '🐍',
    'นมงู',
    'ทราน',
    'มีงู',
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
    if (retryCount > 3) {
        console.error(`Too many retries. Stopping.`)
        clicksDone = 0
        retryCount = 0
        return
    }

    const backBtn = getElementByText('span', 'Back')?.parentElement

    if (backBtn) {
        backBtn.click()
        await sleep(800)
    }

    const profileBtn = getElementByText('div', 'Open Profile')

    const delay = randomDelay(minDelay, maxDelay)

    if (!profileBtn) {
        console.error('Profile button not found')
        retryCount++
        setTimeout(startAction, delay)
        return
    }

    profileBtn.click()

    await sleep(800)

    const nopeBtn = getElementByText('button', 'Nope')

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

    if (haveChildren) {
        return clickNopeButton(
            nopeBtn,
            `Nope due to having children (${clicksDone}/${totalClicks})`,
            delay
        )
    }

    const likeBtn = getElementByText('button', 'Like')

    if (!likeBtn || likeBtn.getAttribute('aria-disabled') === 'true') {
        console.error(`Like button not found or disabled!`)
        retryCount++
        setTimeout(startAction, delay)
        return
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
