/**
 * Photos de la frise « Histoire » (public/images/Histoire).
 * Clés = année (`annee` dans timeline.json). Ordre des fichiers = ordre d’affichage.
 */
const BASE = '/images/Histoire'

export const histoireImagesByYear = {
  2016: ['1_0.jpg', '1_1.jpg'],
  2017: ['2_0.jpg', '2_1.jpeg'],
  2018: ['3_0.jpg', '3_1.jpg', '3_2.jpg', '3_3.jpg', '3_5.jpg', '3_6.jpg'],
  2019: ['4_1.png', '4_2.jpg', '4_3.jpg', '4_4.jpg', '4_5.jpg', '4_6.jpg', '4_7.jpg', '4_8.jpg'],
  2020: ['5.jpg'],
  2021: ['6.jpg'],
  2023: ['7_0.jpg', '7_1_0.jpg', '7_1_1.jpg', '7_2.jpeg'],
  2024: ['8_0.JPG', '8_1.jpg', '8_2.jpg', '8_3.jpg'],
  2025: ['9_0.jpeg', '9_1.jpg', '9_2.jpeg', '9_4.jpg', '9_5.jpg', '9_8.jpg'],
  2026: ['10_0.jpeg', '10_1_0.jpeg', '10_1_1.jpeg', '10_2.jpeg']
}

/**
 * @param {number} year
 * @returns {string[]} URLs absolues sous /images/Histoire/…
 */
export function histoireUrlsForYear(year) {
  const files = histoireImagesByYear[year]
  if (!files?.length) return []
  return files.map((f) => `${BASE}/${f}`)
}
