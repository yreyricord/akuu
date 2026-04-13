/**
 * Sobrescreve em pt.json blocos revisados em pt-BR (evita repli inglês do build-pt-json).
 *
 * Fontes: data-musee-pt-br.json, data-pt-br-supplement.json, + equipe / volontaires / footer inline.
 * Uso após alterar FR/EN: relançar e rever os JSONs em scripts/.
 *
 * Uso: node scripts/merge-pt-musee-equipe-footer.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const ptPath = join(root, 'src/i18n/pt.json')
const museePath = join(__dirname, 'data-musee-pt-br.json')
const supplementPath = join(__dirname, 'data-pt-br-supplement.json')

const equipePt = {
  alice: {
    role: 'Co-secretária',
    bio: 'Conheceu a AKUU durante uma estadia em Puerto Miguel e integrou a associação ao voltar à França no início de 2026. Com base em Bruxelas, acaba de entrar na equipe.'
  },
  aude: {
    role: 'Co-presidente',
    bio: 'Integrou a AKUU em 2025 pelo serviço cívico em Puerto Miguel. Mais de 12 meses em campo, trabalhando principalmente no Museu Shapishiko.'
  },
  francois: {
    role: 'Co-tesoureiro',
    bio: 'Integrou a AKUU em 2025. Em missão em Puerto Miguel desde julho de 2025, atua no Museu Shapishiko e também como tesoureiro da associação.'
  },
  lea: {
    role: 'Co-secretária',
    bio: 'Integrou a AKUU em 2023. Contribui da França na administração, comunicação e captação de recursos. Missão de quatro meses em Puerto Miguel em 2024 no Museu Shapishiko.'
  },
  marlon: {
    role: 'Co-fundador',
    bio: 'Natural de um pequeno vilarejo amazônico, Marlon é o elo essencial entre a AKUU e as comunidades locais.'
  },
  raphael: {
    role: 'Co-tesoureiro',
    bio: 'Integrou a AKUU em 2023. Trabalha da França na contabilidade e captação de recursos. Missão de quatro meses em Puerto Miguel em 2024 no Museu Shapishiko.'
  },
  yoann: {
    role: 'Co-presidente · Co-fundador',
    bio: 'Co-fundou a AKUU em 2016, aos 22 anos. Mais de 24 meses acumulados em campo entre 2016 e 2020. Participou de quase todos os projetos da associação: Casa AKUU, aulas de inglês, Hydr\'Ama, Museu Shapishiko, Bagazan, AKUUVision. Coordena a associação a partir de Toulouse.'
  }
}

const volontairesPt = {
  hero_title: 'Torne-se um voluntário',
  hero_subtitle: 'Viva uma experiência única no coração da Amazônia peruana',
  why_title: 'Por que ir com a AKUU?',
  why_items: {
    immersion: {
      title: 'Responsabilidades reais',
      text: 'Você responde a uma necessidade expressa diretamente pela comunidade e conduz sua missão do início ao fim.'
    },
    impact: {
      title: 'Agir concretamente pela Amazônia',
      text: 'Quem vive na floresta é seu primeiro protetor. Trabalhar com eles é a forma mais direta de contribuir.'
    },
    skills: {
      title: 'Aprender tanto quanto ensinar',
      text: 'As comunidades amazônicas têm saberes e uma visão de mundo que transformam quem vai ao encontro delas.'
    },
    community: {
      title: 'Uma experiência que importa',
      text: 'Num projeto de longo prazo, ao lado de pessoas que escolheram acolhê-lo.'
    }
  },
  process_kicker: 'Em 4 etapas',
  process_title: 'Como funciona?',
  process_steps: {
    step1: {
      title: 'Candidatura',
      text: 'Envie sua candidatura pelo nosso formulário de contato.'
    },
    step2: {
      title: 'Entrevista',
      text: 'Conversa com a equipe para validar sua motivação.'
    },
    step3: {
      title: 'Preparação',
      text: 'Formação pré-partida e apoio logístico.'
    },
    step4: {
      title: 'Missão',
      text: 'Partida para Puerto Miguel e imersão nos projetos.'
    }
  },
  missions_title: 'Tipos de missões',
  missions: {
    civique: {
      title: 'Serviço cívico',
      text: 'Via AIME ONG / France Volontaires. 6 a 12 meses.'
    },
    benevole: {
      title: 'Voluntariado de longo prazo',
      text: 'Missão de 3 a 6 meses em campo.'
    },
    stage: {
      title: 'Estágio',
      text: 'Estágio conveniado de 2 a 6 meses.'
    }
  },
  testimonials_title: 'Depoimentos',
  testimonials_submit_intro: 'Para acrescentar seu depoimento, envie uma foto e uma mensagem para ',
  testimonials: {
    ilona: {
      kicker: 'Depoimento',
      name: 'Ilona Crozes',
      mission: 'Museu Shapishiko, Puerto Miguel',
      photo_alt: 'Retrato de Ilona Crozes, voluntária AKUU',
      quote: 'Em Puerto Miguel, o projeto do museu Shapishiko me proporcionou uma experiência memorável: participar de algo concreto e me impregnar do modo de vida e dos valores da comunidade.'
    },
    aude: {
      kicker: 'Depoimento',
      name: 'Aude Lainé',
      mission: 'Co-presidente · AKUU',
      photo_alt: 'Retrato de Aude Lainé, co-presidente da AKUU',
      quote: 'Além de descobrir a missão em campo e a vida em Puerto Miguel, essa experiência me permitiu me engajar numa associação e recuperar uma motivação de verdade. Hoje tenho uma causa que me toca e à qual quero me dedicar plenamente. Também me deu a oportunidade de conhecer pessoas incríveis, entre os moradores de Puerto Miguel e na equipe AKUU 🫶'
    },
    marlon: {
      kicker: 'Depoimento',
      name: 'Marlon Diaz',
      mission: 'Co-fundador · AKUU',
      photo_alt: 'Retrato de Marlon Diaz, co-fundador da AKUU',
      quote: 'A AKUU é um projeto em que acredito fortemente. A AKUU me lembra meu vínculo com a natureza, as tradições. Essa palavra significa o compartilhamento de energias, o respeito à floresta, à sua fauna, à sua flora...'
    }
  },
  video_kicker: 'Em campo',
  video_title: 'A vida em Puerto Miguel',
  cta_title: 'Pronto para partir?',
  cta_text: 'Fale conosco para saber mais sobre as missões disponíveis.',
  cta_button: 'Falar conosco'
}

const footerPt = {
  slogan: 'Na Amazônia e na França, a AKUU mobiliza voluntários e comunidades locais em torno de projetos concretos de solidariedade.',
  manifeste: 'Construir pontes entre os povos, preservar o que nos sustenta.',
  address_line1: 'Associação francesa (lei 1901)',
  address_line2: 'França',
  nav_title: 'Navegação',
  nav_links_title: 'Links rápidos',
  contact_title: 'Contato',
  social_title: 'Siga-nos',
  legal: '© {year} AKUU, associação francesa (lei 1901)',
  copyright_detail: 'AKUU, associação francesa (lei 1901)',
  don_cta: 'Faça uma doação',
  rna: 'RNA W061008697',
  loi1901: 'Associação francesa (lei 1901)',
  newsletter_title: 'Fique por dentro',
  newsletter_placeholder: "seu{'@'}email.com",
  newsletter_submit: 'Inscrever-se',
  newsletter_success: 'Obrigado! Manteremos você informado.',
  newsletter_error: 'Não foi possível enviar. Tente de novo no site publicado ou escreva para nós.',
  newsletter_honeypot: 'Não preencha'
}

const pt = JSON.parse(readFileSync(ptPath, 'utf8'))
const musee = JSON.parse(readFileSync(museePath, 'utf8'))
const supplement = JSON.parse(readFileSync(supplementPath, 'utf8'))

pt.musee = musee
pt.equipe = equipePt
pt.volontaires = volontairesPt
Object.assign(pt.footer, footerPt)

for (const key of ['hydrama', 'gestion_dechets', 'akuuvision', 'casa_akuu', 'cours_anglais']) {
  if (supplement[key]) pt[key] = supplement[key]
}

writeFileSync(ptPath, `${JSON.stringify(pt, null, 2)}\n`, 'utf8')
console.log(
  'Updated pt.json: musee, equipe, volontaires, footer, hydrama, gestion_dechets, akuuvision, casa_akuu, cours_anglais (pt-BR).'
)
