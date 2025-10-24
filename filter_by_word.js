// SETTINGS
const totalClicks = 5000 // total actions to perform
const minDelay = 500 // minimum delay in ms
const maxDelay = 1000 // maximum delay in ms

let clicksDone = 0
let retryCount = 0

const bannedWords = [
    'ladyboy',
    'กระเทย',
    'กะเทย',
    'singlemom',
    'singlemother',
    'เกย์',
    'ชายแท้',
    'สาวสอง',
    'gay',
    'transgender',
    'trangender',
    'lgbt',
    'lgtv',
    'สาว2',
    'แม่',
    'เลี้ยงเดี่ยว',
    'notgirl',
    'notagirl',
    'ใช่ผู้หญิง',
    'ใช่ผญ',
    '🏳️‍🌈',
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
    'ไม่แปลง',
    'ว2',
    'เปย์',
    'notarealwoman',
    'notrealwoman',
    'ไม่หญิง',
]

const bannedSex = ['gay', 'queer', 'questioning']

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

function cleanText(text) {
    return text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\u0E00-\u0E7F\p{Emoji}\p{Emoji_Component} ]/gu, '')
        .replace(/\s+/g, '')
}

function findBannedWords(text, wordArr) {
    const texts = cleanText(text)

    return wordArr.filter(word => texts.includes(word.toLowerCase()))
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

    const nameContainer = document.getElementsByClassName('Pend(8px)')?.[0]

    if (nameContainer) {
        let name = nameContainer.textContent

        console.log('name:', name)

        const foundBannedWords = findBannedWords(name, bannedWords)

        if (foundBannedWords.length) {
            return clickNopeButton(
                nopeBtn,
                `Nope due to banned words in name: ${foundBannedWords.join(
                    ', '
                )} (${clicksDone}/${totalClicks})`,
                delay
            )
        }
    }

    let aboutMe = getElementByText('div', 'About me')?.nextElementSibling
        ?.textContent

    if (aboutMe) {
        console.log('aboutMe:', aboutMe)

        const foundBannedWords = findBannedWords(aboutMe, bannedWords)

        if (foundBannedWords.length) {
            return clickNopeButton(
                nopeBtn,
                `Nope due to banned words in about me: ${foundBannedWords.join(
                    ', '
                )} (${clicksDone}/${totalClicks})`,
                delay
            )
        }
    }

    const essentials = getElementByText('div', 'Essentials')?.nextElementSibling
        ?.textContent

    if (essentials) {
        const foundBannedWords = findBannedWords(essentials, bannedSex)

        if (foundBannedWords.length) {
            return clickNopeButton(
                nopeBtn,
                `Nope due to sexual oreientation essentials: ${foundBannedWords.join(
                    ','
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
