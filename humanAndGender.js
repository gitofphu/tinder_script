let cachedGenderClassifier = null
let cachedObjectDetector = null

async function analyzeGenderIfPersonPresentConsole(imgElement) {
    if (!imgElement || imgElement.tagName !== 'IMG') {
        throw new Error(
            '❌ Invalid input: You must pass a valid HTML <img> element.',
        )
    }

    if (!imgElement.complete) {
        await new Promise(resolve => {
            imgElement.onload = resolve
        })
    }

    const { pipeline, env } =
        await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0/+esm')
    env.allowLocalModels = false

    // --- FIX: Using the official 'yolos-tiny' model ---
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

    const canvas = document.createElement('canvas')
    canvas.width = imgElement.naturalWidth
    canvas.height = imgElement.naturalHeight
    canvas.getContext('2d').drawImage(imgElement, 0, 0)
    const dataURL = canvas.toDataURL('image/jpeg', 0.8)

    console.log('🔍 Fast-scanning original image for people...')
    // I lowered the threshold to 0.5, which is the sweet spot for the yolos-tiny model
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
const myImage = document.querySelector('img');
analyzeGenderIfPersonPresentConsole(myImage).then(result => console.log("Final Result:", result)).catch(console.error);
