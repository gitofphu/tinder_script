const tag = (label, bg, color) => [
    `%c${label}`,
    `background:${bg};color:${color};padding:1px 7px;border-radius:3px;font-weight:bold`,
]

export const log = {
    like:  (msg, ...rest) => console.log( ...tag('✅ LIKE',   '#14532d', '#86efac'), msg, ...rest),
    nope:  (msg, ...rest) => console.warn(...tag('🚫 NOPE',   '#7c2d12', '#fdba74'), msg, ...rest),
    scan:  (msg, ...rest) => console.log( ...tag('🔍 SCAN',   '#2e1065', '#c4b5fd'), msg, ...rest),
    loop:  (msg, ...rest) => console.log( ...tag('🔄 LOOP',   '#1e3a5f', '#93c5fd'), msg, ...rest),
    event: (msg, ...rest) => console.log( ...tag('🎯 EVENT',  '#064e3b', '#6ee7b7'), msg, ...rest),
    info:  (msg, ...rest) => console.log( ...tag('ℹ INFO',    '#1c1917', '#d6d3d1'), msg, ...rest),
    error: (msg, ...rest) => console.error(...tag('❌ ERROR',  '#450a0a', '#fca5a5'), msg, ...rest),
    model: (msg, ...rest) => console.log( ...tag('🤖 MODEL',  '#451a03', '#fcd34d'), msg, ...rest),
    warn:  (msg, ...rest) => console.warn( ...tag('⚠ WARN',   '#431407', '#fb923c'), msg, ...rest),
}
