import {
    totalClicks,
    minDelay,
    maxDelay,
    MAX_DISTANT_KM,
} from '../constants/settings.js'
import { bannedWords, acceptedWords, bannedSex } from '../constants/words.js'
import { getElementByText } from '../utils/dom.js'
import { findWords } from '../utils/text.js'
import { randomDelay, sleep } from '../utils/timing.js'

/**
 * @param {{ onBeforeLike?: (clicksDone: number, totalClicks: number) => Promise<string|null> }} options
 * onBeforeLike: return a nope reason string to skip, or null to proceed with like
 */
export function createStartAction({ onBeforeLike } = {}) {
    async function startAction() {
        let clicksDone = 0
        let retryCount = 0

        while (true) {
            const noThanksBtn = getElementByText('div', 'No Thanks')
            if (noThanksBtn) noThanksBtn.click()
            const maybeLaterBtn = getElementByText('div', 'Maybe Later')
            if (maybeLaterBtn) maybeLaterBtn.click()
            const closeBtn = getElementByText('div', 'Close')
            if (closeBtn) closeBtn.click()

            if (retryCount > 3) {
                console.error(`Too many retries. Stopping.`)
                return
            }

            const continueBtn = getElementByText('span', 'Continue')

            if (continueBtn) {
                console.error(`Run out of likes. Stopping.`)
                return
            }

            const backBtn = getElementByText('span', 'Back')?.parentElement

            if (backBtn) {
                backBtn.click()
                await sleep(800)
            }

            const profileBtn = getElementByText('div', 'Open Profile')

            if (!profileBtn) {
                console.error('Profile button not found')
                retryCount++
                await sleep(5000)
                continue
            }

            profileBtn.click()
            await sleep(800)

            const nopeBtn = getElementByText('button', 'Nope')
            const delay = randomDelay(minDelay, maxDelay)

            let nopeReason = null

            const haveOnePicture = document.querySelector('[aria-label="1 of 1"]')
            if (haveOnePicture) {
                nopeReason = `Nope due to only have one picture: (${clicksDone}/${totalClicks})`
            }

            if (!nopeReason) {
                const nameContainer = document.getElementsByClassName('Pend(8px)')?.[0]

                if (nameContainer) {
                    const name = nameContainer.textContent

                    console.log('name:', name)

                    const foundBannedWords = findWords(name, bannedWords)

                    if (foundBannedWords.length) {
                        nopeReason = `Nope due to banned words in name: ${foundBannedWords.join(', ')} (${clicksDone}/${totalClicks})`
                    }
                }
            }

            if (!nopeReason) {
                const aboutMe = getElementByText('div', 'About me')?.nextElementSibling?.textContent

                if (aboutMe) {
                    console.log('aboutMe:', aboutMe)

                    const foundBannedWords = findWords(aboutMe, bannedWords)
                    const foundAcceptedWords = findWords(aboutMe, acceptedWords)

                    if (foundBannedWords.length && foundAcceptedWords.length === 0) {
                        nopeReason = `Nope due to banned words in about me: ${foundBannedWords.join(', ')} (${clicksDone}/${totalClicks})`
                    }
                }
            }

            if (!nopeReason) {
                const essentialContainer = getElementByText('div', 'Essentials')
                    ?.nextElementSibling?.children

                if (essentialContainer) {
                    const essentials = Array.from(essentialContainer).reduce(
                        (acc, curr) => (curr.outerText ? [...acc, curr.outerText] : acc),
                        [],
                    )

                    for (const essential of essentials) {
                        if (essential.includes('kilometers away')) {
                            const distant = essential.split(' ')

                            if (Number(distant[0]) > MAX_DISTANT_KM) {
                                nopeReason = `Nope due to distant: ${distant[0]} kilometers away, (${clicksDone}/${totalClicks})`
                                break
                            }
                        }

                        const foundBannedWords = findWords(essential, bannedSex)

                        if (foundBannedWords.length) {
                            nopeReason = `Nope due to sexual oreientation essentials: ${foundBannedWords.join(',')} (${clicksDone}/${totalClicks})`
                            break
                        }
                    }
                }
            }

            if (!nopeReason) {
                const haveChildren = getElementByText('h3', 'Family Plans')
                    ?.nextElementSibling?.textContent?.toLowerCase()
                    ?.includes('i have children')

                if (haveChildren) {
                    nopeReason = `Nope due to having children (${clicksDone}/${totalClicks})`
                }
            }

            if (!nopeReason && onBeforeLike) {
                nopeReason = await onBeforeLike(clicksDone, totalClicks)
            }

            if (nopeReason) {
                if (!nopeBtn) {
                    console.error('Nope button not found, retrying...')
                    retryCount++
                    await sleep(delay)
                    continue
                }

                nopeBtn.click()
                clicksDone++
                console.error(nopeReason)

                if (clicksDone < totalClicks) {
                    await sleep(delay)
                    continue
                }

                console.log('Finished all actions.')
                return
            }

            const likeBtn = getElementByText('button', 'Like')

            if (!likeBtn || likeBtn.getAttribute('aria-disabled') === 'true') {
                console.error(`Like button not found or disabled!`)
                retryCount++
                await sleep(delay)
                continue
            }

            likeBtn.click()
            retryCount = 0
            clicksDone++
            console.log(`Liked (${clicksDone}/${totalClicks})`)

            if (clicksDone < totalClicks) {
                console.log(`Waiting for ${delay} ms before next action...`)
                await sleep(delay)
            } else {
                console.log('Finished all actions.')
                return
            }
        }
    }

    return startAction
}
