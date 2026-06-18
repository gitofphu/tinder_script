// --- Image Processing and ONNX Inference Function ---

// Global placeholder for the scanner function
async function initializeBSizeDetectorModel(
    modelUrl = 'https://raw.githubusercontent.com/gitofphu/tinder_script/main/Anzhcs_Breast_size_det_cls_v8_640_y11m.onnx',
) {
    console.log('⏳ Step 1: Loading ONNX Runtime Web script...')

    await new Promise((resolve, reject) => {
        if (window.ort) return resolve()
        const script = document.createElement('script')
        script.src =
            'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js'
        script.onload = resolve
        script.onerror = () => reject(new Error('Failed to load ONNX script'))
        document.head.appendChild(script)
    })

    console.log('⏳ Step 2: Downloading and preparing YOLO model (38MB)...')

    const session = await ort.InferenceSession.create(modelUrl, {
        executionProviders: ['webgpu', 'wasm'],
    })

    console.log(
        '🚀 Model successfully cached in browser memory! Ready to scan.',
    )

    // Return the fast scanning function
    return async function (input) {
        let imgElement = input

        // --- NEW: Check if the input is a URL string ---
        if (typeof input === 'string') {
            try {
                imgElement = new Image()
                imgElement.crossOrigin = 'anonymous' // Helps prevent canvas security errors
                imgElement.src = input

                // Pause and wait for the image to finish downloading in the background
                await new Promise((resolve, reject) => {
                    imgElement.onload = resolve
                    imgElement.onerror = reject
                })
            } catch (err) {
                console.error('❌ Failed to load image from URL.')
                return { success: false, reason: 'Invalid or blocked URL' }
            }
        }
        // If it's not a string, check if it's a valid HTML image element
        else if (!imgElement || imgElement.tagName !== 'IMG') {
            console.error(
                '❌ Please pass a valid <img> element or an image URL string.',
            )
            return null
        }

        try {
            const targetSize = 640
            const canvas = document.createElement('canvas')
            canvas.width = targetSize
            canvas.height = targetSize
            const ctx = canvas.getContext('2d')

            ctx.drawImage(imgElement, 0, 0, targetSize, targetSize)
            const imageData = ctx.getImageData(
                0,
                0,
                targetSize,
                targetSize,
            ).data

            const float32Data = new Float32Array(3 * targetSize * targetSize)
            for (let i = 0; i < targetSize * targetSize; i++) {
                float32Data[i] = imageData[i * 4] / 255.0
                float32Data[targetSize * targetSize + i] =
                    imageData[i * 4 + 1] / 255.0
                float32Data[2 * targetSize * targetSize + i] =
                    imageData[i * 4 + 2] / 255.0
            }

            const inputName = session.inputNames[0]
            const inputTensor = new ort.Tensor('float32', float32Data, [
                1,
                3,
                targetSize,
                targetSize,
            ])

            const results = await session.run({ [inputName]: inputTensor })
            const outputName = session.outputNames[0]
            const outputData = results[outputName].data

            let bestScore = 0
            let bestClassIndex = -1
            let bestBox = null

            const numAnchors = 8400
            const numClasses = 15

            for (let i = 0; i < numAnchors; i++) {
                let maxClassScore = 0
                let classIndex = -1

                for (let c = 0; c < numClasses; c++) {
                    const score = outputData[(4 + c) * numAnchors + i]
                    if (score > maxClassScore) {
                        maxClassScore = score
                        classIndex = c
                    }
                }

                if (maxClassScore > bestScore) {
                    bestScore = maxClassScore
                    bestClassIndex = classIndex
                    bestBox = {
                        cx: outputData[0 * numAnchors + i],
                        cy: outputData[1 * numAnchors + i],
                        width: outputData[2 * numAnchors + i],
                        height: outputData[3 * numAnchors + i],
                    }
                }
            }

            /* ====================================================
        CLASS ID REFERENCE GUIDE FOR THIS SPECIFIC YOLO MODEL:
        ====================================================
        0  = Flat
        1  = Small
        2  = Medium
        3  = Large
        4  = Huge
        5  = Gigantic
        6  = Gigantic+
        7  = Hyper
        8  = Hyper+
        9  = Hyper++
        10 = Extreme
        11 = Extreme+
        12 = Extreme++
        13 = Titan
        14 = Unmeasurable / Out of frame
        ====================================================
      */

            if (bestScore > 0.4) {
                return {
                    success: true,
                    classId: bestClassIndex,
                    confidence: `${(bestScore * 100).toFixed(1)}%`,
                    box: bestBox,
                }
            } else {
                return { success: false, reason: 'Low confidence score' }
            }
        } catch (err) {
            console.error('❌ Scan Error:', err)
            return { success: false, error: err.message }
        }
    }
}

const scanImageForBraSize = await initializeBSizeDetectorModel()

async function scanMultipleImagesSafely(imageArray) {
    console.log(`⏳ Starting sequential scan of ${imageArray.length} images...`)
    const results = []

    for (const img of imageArray) {
        try {
            // Wait for one to finish completely before starting the next
            const result = await scanImageForBraSize(img)
            results.push({ ...result, imageSource: img })
        } catch (error) {
            console.error('❌ Failed to scan an image:', error)
            results.push({ success: false, error: error.message })
        }
    }

    console.log('✅ All images processed!')
    return results
}

// Helper function for the setDelay
const setDelay = ms => new Promise(resolve => setTimeout(resolve, ms))

async function collectImageUrls(nextBtn) {
    const collectedUrls = []

    // 1. Find the spescific slider container
    const sliderContainer = document.querySelector(
        '.profileCard__slider.keen-slider',
    )

    if (!sliderContainer) {
        console.log('Could not find the slider container.')
        return
    }

    // 2. Loop directly through the container's direct children
    for (const slide of sliderContainer.children) {
        // 3. Search inside this specific slide for the div containing the image
        // We use a CSS selector to find the nested div with role="img"
        const innerDiv = slide.querySelector(
            'div[role="img"][style*="background-image"], div[role="img"] div[role="img"]',
        )

        if (innerDiv) {
            const rawBgImage = innerDiv.style.backgroundImage

            if (rawBgImage) {
                // Clean up the URL string
                const imageUrl = rawBgImage
                    .replace(/^url\(["']?/, '')
                    .replace(/["']?\)$/, '')
                collectedUrls.push(imageUrl)
            }
        }

        nextBtn.click()

        // Wait for 500 milliseconds before moving to the next child
        await setDelay(500)
    }

    console.log('Finished processing all slides!')
    return collectedUrls
}

// --- Image Processing and ONNX Inference Function End ---

// --- Filter by Word Function ---

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

// --- Filter by Word Function End ---

// Run the main function to start the process

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

    let nextBtn = document.querySelector('button[aria-label="Next Photo"]')

    const imageUrls = await collectImageUrls(nextBtn)

    if (!imageUrls?.length) {
        return clickNopeButton(
            `Nope due to no images available (${clicksDone}/${totalClicks})`,
        )
    }

    const scanResults = await scanMultipleImagesSafely(imageUrls)

    console.log('Scan results for all images:', scanResults)

    let maxClassId = 0

    scanResults.forEach((result, index) => {
        if (!result.success) return

        if (result.classId > maxClassId) {
            maxClassId = result.classId
        }

        console.log(
            `✅ Image ${index + 1}: Class ${result.classId} with confidence ${result.confidence}, Source: ${result.imageSource}`,
        )
    })

    if (maxClassId < 2) {
        return clickNopeButton(
            `Nope due to low class (${clicksDone}/${totalClicks})`,
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

// const globalBtn = getElementByText('button', 'Go Global')

console.log('Finished loading the script. Ready to start!')
startAction()
