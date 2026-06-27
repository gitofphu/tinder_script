const backToExploreBtn = getElementByText('button', 'Back to Explore')
if (backToExploreBtn) {
    console.log('backToExploreBtn found')
}

const exploreBtn = getElementByText('a', 'Explore')
if (exploreBtn) {
    console.log('exploreBtn found')
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

const gamersBtn = getElementByText('button', 'Gamers')
if (gamersBtn) {
    console.log('gamersBtn found')
}
