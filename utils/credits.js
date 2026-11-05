// Credits & donation address — part of the license terms (see LICENSE).
// Stored encoded and verified at runtime; if they are changed the app stops
// showing market data and shows "Unofficial build" instead.
const K = [90, 19, 119, 44, 65]
const A = [14, 95, 61, 108, 8, 1, 124, 31, 114, 56, 114, 11, 117, 45, 80, 118, 4, 77, 31, 173, 175, 178, 135, 221, 128, 160, 245, 169, 187, 238, 176, 160, 228, 170]
const N = [17, 93, 52]
const H = 2906745327

function dec(arr) {
  let s = ''
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i] ^ K[i % K.length] ^ ((i * 7) & 0xff))
  return s
}
function djb2(s) {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0)
  return h
}

export const DONATE = dec(A)
export const DEVELOPER = dec(N)
export const OFFICIAL = djb2(DONATE + '|' + DEVELOPER) === H
