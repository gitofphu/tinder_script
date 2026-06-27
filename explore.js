// const backToExploreBtn = getElementByText('button', 'Back to Explore')
// if (backToExploreBtn) {
//     console.log('backToExploreBtn found')
// }

function getElementByText(tag, text) {
    return Array.from(document.querySelectorAll(tag)).find(
        item => item.textContent.trim() === text,
    )
}

const exploreList = [
    'Long-term partner',
    'Short-term fun',
    'New friends',
    'Non-monogamous',
    'Photo Verified',
    'Travel',
    'Music Mode',
    'Binge Watchers',
    'Sporty',
    'Date Night',
    'Thrill Seekers',
    'Creatives',
    'Foodies',
    'Nature Lovers',
    'Music Lovers',
    'Self Care',
    'Gamers',
    'Animal Parents',
]

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const looping = async () => {
    console.log('Starting loop...')

    for (const item of exploreList) {
        console.log(`Processing item: ${item}`)

        const itemBtn = getElementByText('div', item)
        if (!itemBtn) {
            console.log(`Item button for "${item}" not found`)
            continue
        }

        console.log({ itemBtn })
        itemBtn.click()
        await delay(2000)

        // const xpath = `//h2[text()="${item}"]`
        // const navElement = document.evaluate(
        //     xpath,
        //     document,
        //     null,
        //     XPathResult.FIRST_ORDERED_NODE_TYPE,
        //     null,
        // ).singleNodeValue
        // console.log({ navElement })
        // await delay(1000)
    }

    console.log('Loop finished!')
}

const startExecution = async () => {
    const path = window.location.pathname.split('/')

    if (path[2] === 'recs') {
        // mode = 'recs'
        console.log('Mode: recs')
    } else if (path[2] === 'explore') {
        // mode = 'explore'
        console.log('Mode: explore')
        await looping()
    }

    const exploreBtn = getElementByText('a', 'Explore')
    if (!exploreBtn) {
        console.log('exploreBtn not found, stopping...')
        return
    }
    exploreBtn.click()
 console.log('waiting for 5 seconds before starting the next action...')

    await delay(5000)

    await startExecution()
}

