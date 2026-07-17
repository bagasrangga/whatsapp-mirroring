const text = "<attached: 00000011-PHOTO-2026-07-17-13-33-29.jpg>";
const ATTACHMENT_REGEX = /^[\u200e\u202a\u202c]*<attached:\s*(.+)>\s*$/i;
console.log("Match:", text.match(ATTACHMENT_REGEX) !== null);
