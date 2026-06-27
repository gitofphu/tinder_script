import { log } from '../utils/logger.js'

const classIdToBraSize = {
    0: 'Flat',
    1: 'Small',
    2: 'Medium',
    3: 'Large',
    4: 'Huge',
    5: 'Gigantic',
    6: 'Gigantic+',
    7: 'Hyper',
    8: 'Hyper+',
    9: 'Hyper++',
    10: 'Extreme',
    11: 'Extreme+',
    12: 'Extreme++',
    13: 'Titan',
    14: 'Unmeasurable / Out of frame',
}

export function getBraSizeFromClassId(classId) {
    return classIdToBraSize[classId] || 'Unknown'
}

export async function initializeBSizeDetectorModel(
    modelUrl = 'https://raw.githubusercontent.com/gitofphu/tinder_script/main/Anzhcs_Breast_size_det_cls_v8_640_y11m.onnx',
) {
    log.model('Step 1: Loading ONNX Runtime Web script...')

    await new Promise((resolve, reject) => {
        if (window.ort) return resolve()
        const script = document.createElement('script')
        script.src =
            'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.26.0/dist/ort.min.js'
        script.onload = resolve
        script.onerror = () => reject(new Error('Failed to load ONNX script'))
        document.head.appendChild(script)
    })

    log.model('Step 2: Downloading and preparing YOLO model (38MB)...')

    const session = await ort.InferenceSession.create(modelUrl, {
        executionProviders: ['webgpu', 'wasm'],
    })

    log.model('Model successfully cached in browser memory! Ready to scan.')

    let isScanning = false

    return async function (input) {
        while (isScanning) {
            await new Promise(r => setTimeout(r, 50))
        }
        isScanning = true
        try {
            return await scan(input)
        } finally {
            isScanning = false
        }
    }

    async function scan(input) {
        let imgElement = input

        if (typeof input === 'string') {
            try {
                imgElement = new Image()
                imgElement.crossOrigin = 'anonymous'
                imgElement.src = input

                await new Promise((resolve, reject) => {
                    imgElement.onload = resolve
                    imgElement.onerror = reject
                })
            } catch (err) {
                log.error('Failed to load image from URL.')
                return { success: false, reason: 'Invalid or blocked URL' }
            }
        } else if (!imgElement || imgElement.tagName !== 'IMG') {
            log.error(
                'Please pass a valid <img> element or an image URL string.',
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
                    braSize: getBraSizeFromClassId(bestClassIndex),
                    confidence: `${(bestScore * 100).toFixed(1)}%`,
                    box: bestBox,
                }
            } else {
                return { success: false, reason: 'Low confidence score' }
            }
        } catch (err) {
            log.error('Scan Error:', err)
            return { success: false, error: err.message }
        }
    }
}
