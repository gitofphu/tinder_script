import { sleep } from '../utils/timing.js'

export async function scanMultipleImagesSafely(imageArray, scanFn) {
    console.log(`⏳ Starting sequential scan of ${imageArray.length} images...`)
    const results = []

    for (const img of imageArray) {
        try {
            const result = await scanFn(img)
            results.push({ ...result, imageSource: img })
        } catch (error) {
            console.error('❌ Failed to scan an image:', error)
            results.push({ success: false, error: error.message })
        }
    }

    console.log('✅ All images processed!')
    return results
}

export async function collectImageUrls(nextBtn) {
    const collectedUrls = []

    const sliderContainer = document.querySelector('.profileCard__slider.keen-slider')

    if (!sliderContainer) {
        console.log('Could not find the slider container.')
        return collectedUrls
    }

    for (const slide of sliderContainer.children) {
        const innerDiv = slide.querySelector(
            'div[role="img"][style*="background-image"], div[role="img"] div[role="img"]',
        )

        if (innerDiv) {
            const rawBgImage = innerDiv.style.backgroundImage

            if (rawBgImage) {
                const imageUrl = rawBgImage
                    .replace(/^url\(["']?/, '')
                    .replace(/["']?\)$/, '')
                collectedUrls.push(imageUrl)
            }
        }

        nextBtn?.click()
        await sleep(500)
    }

    console.log('Finished processing all slides!')
    return collectedUrls
}
