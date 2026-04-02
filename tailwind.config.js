/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        /* Verts AKUU */
        forest: {
          DEFAULT: '#2D6915',
          50: '#F0F7EC',
          100: '#DFEFCF',
          200: '#B5D99A',
          300: '#8BC365',
          400: '#5CA33A',
          500: '#2D6915',
          600: '#245511',
          700: '#1B400D',
          800: '#122B09',
          900: '#091605'
        },
        leaf: {
          DEFAULT: '#A6C639',
          50: '#F5F9E8',
          100: '#ECF3D1',
          200: '#D9E7A3',
          300: '#C5DB75',
          400: '#B2CF47',
          500: '#A6C639',
          600: '#85A02D',
          700: '#647822',
          800: '#435016',
          900: '#21280B'
        },
        'vert-pur': {
          DEFAULT: '#DFE6C4',
          50: '#F7F9F0',
          100: '#EFF2E1',
          200: '#DFE6C4',
          300: '#CFD9A6',
          400: '#BFCD89',
          500: '#AFC06B'
        },
        /* Bleus AKUU */
        bleu: {
          DEFAULT: '#04488F',
          50: '#E6EEF7',
          100: '#CDDDEF',
          200: '#9BBBDF',
          300: '#6999CF',
          400: '#3777BF',
          500: '#04488F',
          600: '#033A73',
          700: '#022B56',
          800: '#021D3A',
          900: '#010E1D'
        },
        'bleu-ciel': {
          DEFAULT: '#4071A6',
          50: '#EBF0F6',
          100: '#D7E1ED',
          200: '#AFC3DB',
          300: '#87A5C9',
          400: '#5F87B7',
          500: '#4071A6',
          600: '#335A85',
          700: '#264364',
          800: '#1A2D43',
          900: '#0D1621'
        },
        'bleu-pur': {
          DEFAULT: '#C9E1E9',
          50: '#F2F8FA',
          100: '#E5F0F4',
          200: '#C9E1E9',
          300: '#ADD2DE',
          400: '#91C3D3',
          500: '#75B4C8'
        },
        /* Neutres AKUU */
        night: {
          DEFAULT: '#3A4040',
          50: '#EDEDED',
          100: '#DBDCDC',
          200: '#B7B9B9',
          300: '#939696',
          400: '#6F7373',
          500: '#3A4040',
          600: '#2E3333',
          700: '#232626',
          800: '#171A1A',
          900: '#0C0D0D'
        },
        cream: {
          DEFAULT: '#FEFDFC',
          50: '#FFFFFF',
          100: '#FEFDFC',
          200: '#F5F2ED',
          300: '#ECE7DE',
          400: '#E3DCCF',
          500: '#DAD1C0'
        },
        /* Accents chauds (complément de la palette) */
        terracotta: {
          DEFAULT: '#E76F51',
          50: '#FDF0EC',
          100: '#FBE1D9',
          200: '#F7C3B3',
          300: '#F3A58D',
          400: '#EF8767',
          500: '#E76F51',
          600: '#D84E2C',
          700: '#A73C22',
          800: '#762B18',
          900: '#45190E'
        },
        ochre: {
          DEFAULT: '#F4A261',
          50: '#FEF4E8',
          100: '#FDE9D1',
          200: '#FBD3A3',
          300: '#F9BD75',
          400: '#F4A261',
          500: '#F08C33',
          600: '#D6730F',
          700: '#A8590C',
          800: '#7A4009',
          900: '#4C2806'
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px'
      }
    }
  },
  plugins: []
}
