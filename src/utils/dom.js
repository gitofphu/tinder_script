export function getElementByText(tag, text) {
    return Array.from(document.querySelectorAll(tag)).find(
        item => item.textContent.trim() === text,
    )
}

export const LAYOUT = Object.freeze({
    DESKTOP: 'DESKTOP',
    MOBILE: 'MOBILE',
    UNKNOWN: 'UNKNOWN',
})

export function getTinderLayout() {
    if (document.querySelector('.App__body > .desktop')) return LAYOUT.DESKTOP
    if (document.querySelector('.App__body .mobile')) return LAYOUT.MOBILE
    return LAYOUT.UNKNOWN
}
