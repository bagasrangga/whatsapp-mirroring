const text1 = "\u200e[17/07/2026, 1.33.29 PM] ~RIADINIMAKEUP || MUA JOGJA,ID: <attached: 00000011-PHOTO-2026-07-17-13-33-29.jpg>";
const text2 = "[17/07/2026, 1.33.29 PM] ~RIADINIMAKEUP || MUA JOGJA,ID: <attached: 00000011-PHOTO-2026-07-17-13-33-29.jpg>";

const LINE_REGEX = /^[\u200e\u200f\u202a\u202c\u200b]*\[(\d{1,2})\/(\d{1,2})\/(\d{4}),\s(\d{1,2})\.(\d{2})\.(\d{2})\s?(AM|PM)\]\s(.+)$/;

console.log("Match 1:", text1.match(LINE_REGEX) !== null);
console.log("Match 2:", text2.match(LINE_REGEX) !== null);

if (text1.match(LINE_REGEX)) {
  const match = text1.match(LINE_REGEX);
  const content = match[8];
  const colonIdx = content.indexOf(': ');
  console.log("Content:", content);
  console.log("Sender:", content.substring(0, colonIdx));
  console.log("Text:", content.substring(colonIdx + 2));
}
