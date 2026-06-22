// SETTINGS
const totalClicks = 5000 // total actions to perform
const minDelay = 500 // minimum delay in ms
const maxDelay = 1000 // maximum delay in ms
const MAX_DISTANT_KM = 40 // maximum distant in kilometers

let clicksDone = 0
let retryCount = 0

const bannedWords = [
    'ladyboy',
    'กระเทย',
    'กะเทย',
    'singlemom',
    'single mom',
    'singlemother',
    'single mom',
    'เกย์',
    'ชายแท้',
    'สาวสอง',
    'gay',
    'transgender',
    'trangender',
    'lgbt',
    'lgtv',
    'สาว2',
    'เลี้ยงเดี่ยว',
    'notgirl',
    'notagirl',
    'ใช่ผู้หญิง',
    'ใช่ผญ',
    '🏳️‍🌈',
    '🌈',
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
    'notrealgirl',
    'notarealgirl',
    'ไม่หญิง',
    'femboy',
    'feminineboy',
    'notlady',
    'notladies',
    'มีลูก',
    'ไม่ใช่ผญ',
    'muslim',
    'มุสลิม',
    // 'fat',
    // 'อ้วน',
    'แม่ลูก',
]

const acceptedWords = [
    'notaladyboy',
    'notladyboy',
    'ไม่ใช่สาวสอง',
    'ไม่ใช่กระเทย',
    'เป็นผู้หญิง',
]

const bannedSex = ['gay', 'queer', 'questioning']

function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function getElementByText(tag, text) {
    return Array.from(document.querySelectorAll(tag)).find(
        item => item.textContent.trim() === text,
    )
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

function findWords(text, wordArr) {
    const texts = cleanText(text)

    return wordArr.filter(word => texts.includes(word.toLowerCase()))
}

async function startAction() {
const noThanksBtn = getElementByText('div', 'No Thanks')
    if (noThanksBtn) noThanksBtn.click()
    const maybeLaterBtn = getElementByText('div', 'Maybe Later')
    if (maybeLaterBtn) maybeLaterBtn.click()

    if (retryCount > 3) {
        console.error(`Too many retries. Stopping.`)
        clicksDone = 0
        retryCount = 0
        return
    }

    const continueBtn = getElementByText('span', 'Continue')

    if (continueBtn) {
        console.error(`Run out of likes. Stopping.`)
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
        setTimeout(startAction, 5000)
        return
    }

    profileBtn.click()

    await sleep(800)

    const nopeBtn = getElementByText('button', 'Nope')

    function clickNopeButton(reason) {
        nopeBtn.click()
        clicksDone++
        console.error(reason)
        setTimeout(startAction, delay)
    }

    const haveOnePicture = document.querySelector('[aria-label="1 of 1"]')

    if (haveOnePicture) {
        return clickNopeButton(
            `Nope due to only have one picture: (${clicksDone}/${totalClicks})`,
        )
    }

    const nameContainer = document.getElementsByClassName('Pend(8px)')?.[0]

    if (nameContainer) {
        let name = nameContainer.textContent

        console.log('name:', name)

        const foundBannedWords = findWords(name, bannedWords)

        if (foundBannedWords.length) {
            return clickNopeButton(
                `Nope due to banned words in name: ${foundBannedWords.join(
                    ', ',
                )} (${clicksDone}/${totalClicks})`,
            )
        }
    }

    let aboutMe = getElementByText('div', 'About me')?.nextElementSibling
        ?.textContent

    if (aboutMe) {
        console.log('aboutMe:', aboutMe)

        const foundBannedWords = findWords(aboutMe, bannedWords)

        const foundAcceptedWords = findWords(aboutMe, acceptedWords)

        if (foundBannedWords.length && foundAcceptedWords.length === 0) {
            return clickNopeButton(
                `Nope due to banned words in about me: ${foundBannedWords.join(
                    ', ',
                )} (${clicksDone}/${totalClicks})`,
            )
        }
    }

    const essentialContainer = getElementByText('div', 'Essentials')
        ?.nextElementSibling?.children

    if (essentialContainer) {
        const essentials = Array.from(essentialContainer).reduce(
            (acc, curr) => {
                return curr.outerText ? [...acc, curr.outerText] : acc
            },
            [],
        )

        let essentialsError = ''

        for (const essential of essentials) {
            const distantContainer = essential.includes('kilometers away')

            if (distantContainer) {
                const distant = essential.split(' ')

                if (Number(distant[0]) > MAX_DISTANT_KM) {
                    essentialsError = `Nope due to distant: ${distant[0]} kilometers away, (${clicksDone}/${totalClicks})`
                    break
                }
            }

            const foundBannedWords = findWords(essential, bannedSex)

            if (foundBannedWords.length) {
                essentialsError = `Nope due to sexual oreientation essentials: ${foundBannedWords.join(
                    ',',
                )} (${clicksDone}/${totalClicks})`
                break
            }
        }

        if (essentialsError) return clickNopeButton(essentialsError)
    }

    const haveChildren = getElementByText('h3', 'Family Plans')
        ?.nextElementSibling?.textContent?.toLowerCase()
        ?.includes('i have children')

    if (haveChildren) {
        return clickNopeButton(
            `Nope due to having children (${clicksDone}/${totalClicks})`,
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
    retryCount = 0
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
