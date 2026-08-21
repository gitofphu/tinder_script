import Toastify from 'toastify-js'
import toastifyCss from 'toastify-js/src/toastify.css'

const style = document.createElement('style')
style.textContent = toastifyCss
document.head.appendChild(style)

export function showToast(message) {
    Toastify({
        text: message,
        duration: 3000,
        newWindow: true,
        close: true,
        gravity: 'top', // `top` or `bottom`
        position: 'right', // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
            background:
                'linear-gradient(45deg, #fada61 0.000%, #ff9188 50.000%, #ff5acd 100.000%)',
        },
    }).showToast()
}
