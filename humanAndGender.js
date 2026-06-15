let cachedGenderClassifier = null
let cachedObjectDetector = null

async function analyzeGenderIfPersonPresentConsole(input) {
    let imgElement = input

    // --- NEW: Check if the input is a URL string ---
    if (typeof input === 'string') {
        try {
            imgElement = new Image()
            // Required to prevent canvas security (tainted canvas) errors
            imgElement.crossOrigin = 'anonymous'
            imgElement.src = input + `&_nocache=${Date.now()}`

            // Pause execution and wait for the image to download
            await new Promise((resolve, reject) => {
                imgElement.onload = resolve
                imgElement.onerror = reject
            })
        } catch (err) {
            throw new Error(
                '❌ Failed to load image from URL. It may be blocked by CORS.',
            )
        }
    }
    // If it is not a string, check if it's a valid HTML <img> element
    else if (!imgElement || imgElement.tagName !== 'IMG') {
        throw new Error(
            '❌ Invalid input: You must pass a valid HTML <img> element or a URL string.',
        )
    }

    // If you passed an actual <img> element that hasn't finished loading yet
    if (!imgElement.complete) {
        await new Promise(resolve => {
            imgElement.onload = resolve
        })
    }

    // Load Transformers.js
    const { pipeline, env } =
        await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0/+esm')
    env.allowLocalModels = false

    // Initialize YOLOS-Tiny Object Detector
    if (!cachedObjectDetector) {
        console.log('⏳ Initializing YOLOS-Tiny Object Detector with WebGPU...')
        cachedObjectDetector = await pipeline(
            'object-detection',
            'Xenova/yolos-tiny',
            {
                device: 'webgpu',
                dtype: 'q8',
            },
        )
        console.log('✅ Object Detector loaded.')
    }

    // Extract pixel data
    const canvas = document.createElement('canvas')
    // Use naturalWidth/Height, but fallback to width/height if it's a background Image object
    canvas.width = imgElement.naturalWidth || imgElement.width
    canvas.height = imgElement.naturalHeight || imgElement.height
    canvas.getContext('2d').drawImage(imgElement, 0, 0)
    const dataURL = canvas.toDataURL('image/jpeg', 0.8)

    console.log('🔍 Scanning image for people...')
    const detections = await cachedObjectDetector(dataURL, { threshold: 0.5 })

    const hasPerson = detections.some(obj => obj.label === 'person')

    if (!hasPerson) {
        console.log('🚫 No person detected. Skipping gender classification.')
        return {
            success: false,
            reason: 'No person detected.',
            detections: detections,
        }
    }

    console.log('👤 Person detected! Proceeding to gender classification...')

    // Initialize Gender Classifier
    if (!cachedGenderClassifier) {
        console.log('⏳ Initializing Gender Classifier with WebGPU...')
        cachedGenderClassifier = await pipeline(
            'image-classification',
            'onnx-community/gender-classification-ONNX',
            {
                device: 'webgpu',
                dtype: 'q8',
            },
        )
        console.log('✅ Gender Classifier loaded.')
    }

    const predictions = await cachedGenderClassifier(dataURL)
    return { success: true, predictions: predictions, detections: detections }
}

// --- Test execution ---
// const myImage = document.querySelector('img')
// analyzeGenderIfPersonPresentConsole(myImage)
//     .then(result => console.log('Final Result:', result))
//     .catch(console.error)

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
            const result =
                await analyzeGenderIfPersonPresentConsole(injectedImgElement)

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

let finalData = await processImageArraySafely(imageUrls)
console.log(finalData)
