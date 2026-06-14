// Global placeholder for the scanner function
let scanImageForBraSize = null

async function initializeModel(
    // modelUrl = 'http://localhost:8000/Anzhcs_Breast_size_det_cls_v8_640_y11m.onnx',
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

scanImageForBraSize = await initializeModel()

// let currentPhoto = document.querySelector('img')
// let data = await scanImageForBraSize(currentPhoto)

// let imageUrl =
//     'https://images-ssl.gotinder.com/u/rtFnq51bYPYDJwdgeZJ6UB/6dDApVt1Fv3uLrPDZF6dxw.webp?Policy=eyJTdGF0ZW1lbnQiOiBbeyJSZXNvdXJjZSI6IiovdS9ydEZucTUxYllQWURKd2RnZVpKNlVCLyoiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3ODIwNTkyMzZ9fX1dfQ__&Signature=hmz-8IwzyStuNnhPlrR02cJgNyMQHVlV4IR5F2TN0rQp93PPM0v7Hmal0QNyredaeZHxCwR5fQqyEls56zD-mUUUwjY079ZzqWU6bQx5H3uiy6dN0601SQZ54TyGXbFnn59JhL-PqT2ZTNFNV2B5QqGNOCBVPLjK8ysKNkjg4JfM~oNJTPMLFCts5zu4udZQwtgJS02tqRnbMFeezT8Xn028G6~AFzjcOqxO7I2r6wh-WngQiqQiTN~qZ3PAR9GkJupRngNJoKWgBfT7Frr3qkf4BGJbQ9qCsP0LV~VuAZrqZM0gybTwE~iKN7yA1gLRb4ukog9q4v1R7gpEnjorpg__&Key-Pair-Id=K368TLDEUPA6OI'
// let data = await scanImageForBraSize(imageUrl)

// if (data && data.success) {
//     console.log(
//         `✨ AI detected a visual profile category of: Class ${data.classId} (${data.confidence} confidence)`,
//     )
// } else {
//     console.log(
//         '⚠️ Unable to determine visual profile category:',
//         data.reason || data.error,
//     )
// }

async function scanMultipleImagesSafely(imageArray) {
    console.log(`⏳ Starting sequential scan of ${imageArray.length} images...`)
    const results = []

    for (const img of imageArray) {
        try {
            // Wait for one to finish completely before starting the next
            const result = await scanImageForBraSize(img)
            results.push(result)
        } catch (error) {
            console.error('❌ Failed to scan an image:', error)
            results.push({ success: false, error: error.message })
        }
    }

    console.log('✅ All images processed!')
    return results
}

const nextBtn = document.querySelector('button[aria-label="Next Photo"]')

// Helper function for the delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

async function processProfileImagesSlowly() {
    const collectedUrls = []

    // 1. Find the specific slider container
    const sliderContainer = document.querySelector(
        '.profileCard__slider.keen-slider',
    )

    console.log('Slider container found:', sliderContainer)

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
                console.log('Extracted URL:', imageUrl)
            } else {
                console.log('Found inner div, but no background image style.')
            }
        } else {
            console.log('Could not find the inner image div for this slide.')
        }

        nextBtn.click()

        // Wait 1 second before moving to the next child
        await delay(1000)
    }

    console.log('Finished processing all slides!')
    return collectedUrls
}

// Run it!
const imageUrls = await processProfileImagesSlowly()

console.log('Collected image URLs:', imageUrls)

if (imageUrls.length === 0) {
    console.error('No image URLs found to scan.')
} else {
    const scanResults = await scanMultipleImagesSafely(imageUrls)

    console.log('Scan results for all images:', scanResults)
}
