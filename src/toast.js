import Toastify from 'toastify-js'
import toastifyCss from 'toastify-js/src/toastify.css'

const style = document.createElement('style')
style.textContent = toastifyCss
document.head.appendChild(style)

Toastify({
    text: 'This is a toast',
    duration: 3000,
    newWindow: true,
    close: true,
    gravity: 'top', // `top` or `bottom`
    position: 'right', // `left`, `center` or `right`
    stopOnFocus: true, // Prevents dismissing of toast on hover
    style: {
        background: 'linear-gradient(to right, #833AB4,#FD1D1D,#FCB045)',
    },
}).showToast()

console.log('Toastify is working!')
