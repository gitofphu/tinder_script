import { createStartAction } from './actions/startAction.js'
import { initializeBSizeDetectorModel } from './image/detector.js'
import { scanMultipleImagesSafely, collectImageUrls } from './image/scanner.js'

;(async () => {
    const scanImageForBraSize = await initializeBSizeDetectorModel()

    const startAction = createStartAction({
        onBeforeLike: async (clicksDone, totalClicks) => {
            const nextBtn = document.querySelector('button[aria-label="Next Photo"]')
            const imageUrls = await collectImageUrls(nextBtn)

            if (!imageUrls?.length) {
                return `Nope due to no images available (${clicksDone}/${totalClicks})`
            }

            const scanResults = await scanMultipleImagesSafely(imageUrls, scanImageForBraSize)

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
                return `Nope due to low class (${clicksDone}/${totalClicks})`
            }

            return null
        },
    })

    window.scanImageForBraSize = scanImageForBraSize
    window.startAction = startAction
    console.log('Finished loading the script. Ready to start!')
    startAction()
})()
