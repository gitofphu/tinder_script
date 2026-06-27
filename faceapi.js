let faceApiLoaded = false

async function analyzeGenderWithFaceApi(imgElement) {
    // 1. Load the library and models ONCE
    if (!faceApiLoaded) {
        console.log('⏳ Loading face-api.js...')
        await new Promise((resolve, reject) => {
            const script = document.createElement('script')
            // Load the library from a CDN
            script.src =
                'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js'
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script)
        })

        console.log('⏳ Downloading tiny models (~2MB)...')
        // We use the creator's official hosted models to bypass CORS
        const MODEL_URL = 'https://vladmandic.github.io/face-api/model'

        // Load just the tiny face detector and the gender predictor
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
        await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)

        faceApiLoaded = true
        console.log('✅ face-api.js ready!')
    }

    // 2. Scan the injected DOM element
    console.log('🔍 Scanning for faces...')

    // We use TinyFaceDetectorOptions for maximum speed
    const detections = await faceapi
        .detectAllFaces(imgElement, new faceapi.TinyFaceDetectorOptions())
        .withAgeAndGender()

    if (detections.length === 0) {
        console.log('🚫 No face detected.')
        return { success: false, reason: 'No face detected' }
    }

    console.log(`👤 Found ${detections.length} face(s)!`)

    // 3. Return the results (grabbing the gender of the primary/largest face)
    // face-api returns 'male' or 'female' and a probability score.
    return {
        success: true,
        gender: detections[0].gender,
        confidence: `${(detections[0].genderProbability * 100).toFixed(1)}%`,
        allFaces: detections,
    }
}

async function injectImageToDOM(url) {
    return new Promise((resolve, reject) => {
        const img = document.createElement('img')

        // 1. MUST set this before the src, or the canvas will taint!
        img.crossOrigin = 'anonymous'

        // 2. Hide the image completely so it doesn't mess up your screen
        img.style.display = 'none'
        img.style.position = 'absolute'
        img.style.opacity = '0'

        // 3. Resolve the promise ONLY when the DOM has fully rendered the image
        img.onload = () => resolve(img)
        img.onerror = () => {
            // If it fails, remove the broken element so we don't clutter the page
            img.remove()
            reject(new Error('Failed to load injected image.'))
        }

        // 4. Assign the URL and inject it into the website
        img.src = url
        document.body.appendChild(img)
    })
}

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

async function processImageArraySafely(imageArray) {
    console.log(`⏳ Starting sequential scan of ${imageArray.length} images...`)
    const allResults = []

    for (let i = 0; i < imageArray.length; i++) {
        const currentUrl = imageArray[i]
        console.log(`\n📸 Processing image ${i + 1} of ${imageArray.length}...`)

        let injectedImgElement = null

        try {
            // 1. Build the image into the DOM
            injectedImgElement = await injectImageToDOM(currentUrl)

            // 2. Pass the physical DOM element to your unmodified AI function
            const result = await analyzeGenderWithFaceApi(injectedImgElement)

            allResults.push({
                imageSource: currentUrl,
                status: 'success',
                result: result,
            })
        } catch (error) {
            console.error(`❌ Failed on image ${i + 1}:`, error.message)
            allResults.push({
                imageSource: currentUrl,
                status: 'error',
                error: error.message,
            })
        } finally {
            // 3. CLEANUP: Delete the image from the DOM after scanning so it doesn't bloat the webpage
            if (injectedImgElement && injectedImgElement.parentNode) {
                injectedImgElement.remove()
            }
        }
    }

    console.log('\n✅ Entire batch finished!')
    return allResults
}

let nextBtn = document.querySelector('button[aria-label="Next Photo"]')

const imageUrls = await collectImageUrls(nextBtn)

let finalData = await processImageArraySafely(imageUrls)
console.log(finalData)
