import { createStartAction } from './actions/startAction.js'
import { createStartExecution } from './actions/startExecution.js'
import { initializeBSizeDetectorModel } from './image/detector.js'
import { scanMultipleImagesSafely, collectImageUrls } from './image/scanner.js'
import { log } from './utils/logger.js'
;(async () => {
    const scanImageForBraSize = await initializeBSizeDetectorModel()

    const startAction = createStartAction({
        onBeforeLike: async (clicksDone, totalClicks) => {
            const nextBtn = document.querySelector(
                'button[aria-label="Next Photo"]',
            )
            const imageUrls = await collectImageUrls(nextBtn)

            if (!imageUrls?.length) {
                return `Nope due to no images available (${clicksDone}/${totalClicks})`
            }

            const scanResults = await scanMultipleImagesSafely(
                imageUrls,
                scanImageForBraSize,
            )

            log.scan('Scan results for all images:', scanResults)

            let maxClassId = 0

            scanResults.forEach((result, index) => {
                if (!result.success) return

                if (result.classId > maxClassId) {
                    maxClassId = result.classId
                }

                log.scan(
                    `Image ${index + 1}: Class ${result.classId} (${result.braSize}) with confidence ${result.confidence}, Source: ${result.imageSource}`,
                )
            })

            if (maxClassId < 2) {
                return `Nope due to low class (${clicksDone}/${totalClicks})`
            }

            return null
        },
    })

    const startExecution = createStartExecution(startAction, 6)

    window.scanImageForBraSize = scanImageForBraSize
    window.startAction = startAction
    window.startExecution = startExecution
    log.info('Finished loading the script. Ready to start!')
    startExecution(1000)
})()
