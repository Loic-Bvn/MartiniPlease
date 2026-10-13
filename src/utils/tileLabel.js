// Sépare un libellé commençant par un emoji en son icône et son texte.
export function splitLabel(label = '') {
  const m = String(label).match(/^((?:\p{Regional_Indicator}{2}|\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?\p{Emoji_Modifier}?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?\p{Emoji_Modifier}?)*(?:[\u{E0020}-\u{E007E}]+\u{E007F})?))\s*(.*)$/u)
  return m ? { icon: m[1], text: m[2].trimStart() } : { icon: '', text: String(label) }
}
