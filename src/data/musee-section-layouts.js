/**
 * Réglages des blocs texte + photo (page Musée).
 *
 * split        → largeur "texte | image" sur 12 colonnes (md+).
 * visualFrame  → intrinsic + align stretch = image à la hauteur du texte (cover sur desktop).
 * leadVisualOnMobile → photo au-dessus du texte sur petit écran.
 */

export const museeSectionLayout = {
  description: {
    split: '6-6',
    visualFrame: 'intrinsic',
    align: 'stretch'
  },

  context: {
    visualLeft: true,
    split: '7-5',
    visualFrame: 'intrinsic',
    align: 'stretch'
  },

  governance: {
    split: '6-6',
    visualFrame: 'intrinsic',
    align: 'stretch'
  },

  teams: {
    visualLeft: true,
    split: '7-5',
    visualFrame: 'intrinsic',
    align: 'stretch'
  },

  /** Durée & tarifs : photo d’abord sur mobile */
  visit: {
    split: '6-6',
    visualFrame: 'intrinsic',
    align: 'stretch',
    leadVisualOnMobile: true
  }
}
