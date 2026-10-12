// Sépare un libellé « 🔍 Filtres » en { icon: '🔍', text: 'Filtres' }.
// Sert aux tuiles mobiles (icône au-dessus du texte) ; sur desktop les deux
// restent sur une ligne.
export function splitLabel(label = '') {
  const m = String(label).match(/^(\p{Extended_Pictographic}\uFE0F?)\s*(.*)$/u)
  return m ? { icon: m[1], text: m[2] } : { icon: '', text: String(label) }
}
