export function cleanText(text) {
    return text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9฀-๿\p{Emoji}\p{Emoji_Component} ]/gu, '')
        .replace(/\s+/g, '')
}

export function findWords(text, wordArr) {
    const texts = cleanText(text)
    return wordArr.filter(word => texts.includes(word.toLowerCase()))
}
