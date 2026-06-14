const img = document.querySelector('img')

// Call the master workflow function
const result = await analyzeGenderIfPersonPresent(img)

console.log('Final Workflow Result:', result)

if (result.hasPerson) {
    alert(
        `Person found! Top gender prediction: ${result.genderPredictions[0].label}`,
    )
} else {
    alert('No person found in the image.')
}

const nextBtn = document.querySelector('button[aria-label="Next Photo"]')
nextBtn.click()

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
        await delay(250)
    }

    console.log('Finished processing all slides!')
    return collectedUrls
}

// Run it!
const imageUrls = await processProfileImagesSlowly()

console.log('Collected image URLs:', imageUrls)
