/**
 * Fusionne les blocs portugais brésilien (pt-BR) dans les JSON narratifs.
 * Structure identique à fr/en/es.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const hydramaPt = {
  sections: [
    {
      title: 'Um desafio energético no coração da Amazônia',
      paragraphs: [
        'Ao longo do rio Amazonas e de seus afluentes, centenas de comunidades vivem até hoje em isolamento profundo. Longe de qualquer rede elétrica nacional, dependem de grupos geradores a diesel para iluminação, equipamentos coletivos e atividades econômicas — energia cara, poluente e de fornecimento incerto. Diante desse diagnóstico, compartilhado com os moradores de Puerto Miguel e das comunidades vizinhas, a AKUU imaginou uma resposta à altura do desafio: captar a energia diretamente da força do grande rio.'
      ]
    },
    {
      title: 'Um projeto nascido de uma parceria entre duas associações',
      paragraphs: [
        'O Hydr\'Ama é fruto da colaboração entre a AKUU e o WindAid Institute, uma ONG sediada em Trujillo, no Peru, especializada no desenvolvimento e na implementação de tecnologias de energias renováveis (turbinas eólicas) em comunidades isoladas. Essa parceria está no cerne da identidade da AKUU desde a sua fundação em 2016.',
        'A ambição do projeto é clara: conceber, construir e instalar uma turbina hidrocinética no rio Amazonas, capaz de produzir eletricidade limpa só com a força da correnteza.'
      ]
    },
    {
      title: 'Da concepção na França à oficina em Trujillo',
      paragraphs: [
        'Durante a fase de concepção da hidroturbina em código aberto, várias restrições essenciais foram consideradas: a baixa velocidade das correntezas, as cheias sazonais e a necessidade de conceber e fabricar todas as peças localmente no Peru, com técnicas acessíveis (bobinagem, enrolamento manual). Também se deu atenção especial à redução do impacto sobre a vida aquática.',
        'Em Trujillo, em colaboração com a WindAid, a AKUU concebeu o conjunto da hidroturbina, das peças ao rotor, e realizou testes em rio até obter um protótipo validado. O objetivo: desenvolver uma máquina robusta, reproduzível e adaptada aos meios disponíveis em campo.'
      ]
    },
    {
      title: 'Uma comunidade escolhida, uma mobilização coletiva',
      paragraphs: [
        'O local foi escolhido antes mesmo do fim da montagem, com base em critérios precisos: velocidade da correnteza medida, proximidade da água e das moradias, viabilidade técnica e, sobretudo, adesão das autoridades locais e das famílias. Vista Alegre, vizinha à comunidade-piloto da AKUU em Puerto Miguel, reuniu todas essas condições.',
        'Em campo, o compromisso com as comunidades ganhou todo o sentido: os moradores das duas localidades coconstruíram a plataforma a partir dos planos fornecidos pela equipe técnica. Duas semanas de trabalho coletivo permitiram tanto a montagem da instalação quanto a transmissão dos gestos essenciais de manutenção.'
      ]
    },
    {
      title: 'O aval verde das autoridades regionais',
      paragraphs: [
        'Além da obra, um reconhecimento oficial era indispensável numa região onde as questões ligadas à água, ao meio ambiente e aos direitos dos povos indígenas são particularmente sensíveis. O aval das autoridades de Loreto legitimou o projeto, muito além do interesse técnico.'
      ]
    },
    {
      title: 'De volta ao campo: medições e confiança',
      paragraphs: [
        'Patrice, Amandine e Valentin realizaram uma missão de acompanhamento no local: instrumentar a hidroturbina em condições reais, confrontar os modelos teóricos com os dados medidos e reforçar a relação de confiança com a comunidade de Vista Alegre. Os dados coletados seguem alimentando hoje as iterações de concepção.',
        'Em paralelo, outra equipe, treinada pela WindAid nos protocolos de avaliação comunitária, mapeou várias comunidades candidatas e identificou contatos locais capazes de apoiar uma eventual replicação, sem duplicar o trabalho já em curso no local piloto.'
      ]
    },
    {
      title: 'Uma tecnologia open source a serviço de todos',
      paragraphs: [
        'Desde o início, a AKUU optou pela transparência e pelo compartilhamento. Toda a documentação técnica do projeto Hydr\'Ama (cálculos de modelagem, plantas de construção, resultados de testes e opções de concepção) foi reunida em um dossiê livremente acessível. Qualquer pessoa interessada pode solicitá-lo e receber um link de compartilhamento.'
      ]
    },
    {
      title: 'O que esse projeto significa',
      paragraphs: [
        'O Hydr\'Ama não é só um projeto de engenharia. É a demonstração de que uma pequena associação estudantil, munida de competências técnicas e de uma parceria sólida, pode trazer respostas concretas a desafios energéticos que os grandes atores do desenvolvimento muitas vezes não alcançam.',
        'É também a prova de que a transição energética não se faz contra as populações, mas com elas — desde que se reserve tempo para ouvi-las, sentar ao lado delas e construir junto.'
      ]
    }
  ],
  video_intro: 'Outras imagens, incluindo sequências feitas com a WindAid, completam o vídeo de síntese abaixo.',
  join_title: 'Entrar na aventura',
  join_p1: 'Para o relançamento do Hydr\'Ama ou para outros eixos da associação, aliamos competências a necessidades reais: escreva para conversarmos.'
}

const coursPt = {
  sections: [
    {
      title: 'Contexto e nascimento do projeto',
      paragraphs: [
        'A região de Puerto Miguel é uma das mais visitadas da Amazônia peruana: cerca de quinze hospedarias ecológicas ficam bem perto da comunidade, atraindo todos os anos milhares de visitantes estrangeiros. Paradoxalmente, os moradores de Puerto Miguel pouco se beneficiam dessa atividade. São guias vindos da cidade, anglófonos, que acompanham os turistas e ficam com a maior parte da renda. Os moradores, quando muito, são guias auxiliares. Fazem a maior parte do trabalho, conhecem a floresta como ninguém, mas sem inglês ficam de fora e mal remunerados.',
        'Foram o diretor da escola de Puerto Miguel e Marlon Diaz que entraram em contato direto com a AKUU: o pedido de apoio para o ensino de inglês veio primeiro deles e de toda a comunidade. Dominar essa língua é retomar o lugar numa economia turística que atravessa o território deles há anos.'
      ]
    },
    {
      title: 'Um programa feito com a comunidade',
      paragraphs: [
        'Em março de 2018, após a inauguração da casa comunitária de Puerto Miguel, cerca de dez voluntários da AKUU em campo lançaram o programa de ensino em estreita ligação com os moradores. O quadro pedagógico foi pensado não como uma escola clássica, mas como um espaço de aprendizagem vivo, adaptado aos ritmos e às restrições da vida local.',
        'Desde o início, uma convicção orienta o projeto: o ensino deve passar pelo jogo, pela participação ativa e pela troca, mais do que pela repetição e pela imposição. O programa não está fechado: evolui permanentemente com o retorno dos alunos e dos professores voluntários. Cada voluntário é convidado a propor ajustes, a experimentar novos métodos e a se adaptar às necessidades de cada grupo.'
      ]
    },
    {
      title: 'Três grupos, três ritmos',
      paragraphs: [
        'Os alunos estão divididos em três grupos conforme a idade, cada um com seu horário e seus objetivos pedagógicos.',
        'O grupo niños reúne até 30 crianças dos 4 aos 12 anos. Três manhãs por semana — segunda, quarta e sexta — durante uma hora e meia, os mais novos descobrem o inglês por meio de jogos, músicas e encenações. É uma idade em que as línguas se aprendem quase sem esforço e os progressos costumam ser espetaculares.',
        'O grupo segundarios junta cerca de uma dezena de adolescentes dos 12 aos 17 anos, três vezes por semana. A pedagogia insiste mais na expressão oral, na compreensão e em situações concretas do cotidiano. Atividades ligadas a outros projetos da comunidade — exposições, demonstrações, encontros com visitantes — tornam a aprendizagem imediatamente útil.',
        'O grupo adultos, composto por 10 a 15 moradores com 17 anos ou mais, tem aulas cinco vezes por semana, à tarde, depois do trabalho. É nesse grupo que a motivação e os progressos tangíveis costumam ser mais fortes. Esses adultos sabem exatamente por que aprendem inglês: para ter melhores oportunidades profissionais, para se comunicar com os viajantes que sobem o rio, para entender o que a mídia internacional diz sobre o território deles.'
      ]
    },
    {
      title: 'Continuidade garantida, pedagogia viva',
      paragraphs: [
        'Um dos grandes desafios desse tipo de programa é a continuidade. Os professores voluntários se sucedem, cada um com sua personalidade e seus métodos. A AKUU implementou vários mecanismos para que as transições não desestabilizem o ritmo de aprendizagem.',
        'Pede-se a cada voluntário docente que permaneça no mínimo seis meses no local. Dois voluntários estão presentes ao mesmo tempo para garantir continuidade, e permanências de um ano são frequentes. Um guia pedagógico evolutivo é atualizado em campo, traçando as grandes linhas do programa sem engessá-lo.',
        'Em paralelo, um ponto de referência à distância, membro ativo da AKUU, acompanha a evolução do programa e o nível dos alunos. Acompanha os voluntários com entrevistas regulares e difunde métodos de ensino adaptados a esse contexto. No fim de cada missão, os voluntários elaboram um relatório de experiência detalhado que alimenta a melhoria contínua. Desde o lançamento em março de 2018, cerca de trinta voluntários participaram desse projeto de ensino, cada um deixando sua marca e contribuindo para construir algo duradouro.'
      ]
    },
    {
      title: 'Resultados que falam por si',
      paragraphs: [
        'Os progressos observados desde os primeiros meses superaram em muito as expectativas, em particular no grupo de adultos. Moradores que nunca tinham aprendido outra língua além do espanhol passaram a conversar em inglês com visitantes estrangeiros, a entender vídeos e a usar recursos online antes inacessíveis. Dois deles trabalham hoje em hospedarias como guias.'
      ]
    },
    {
      title: 'Horizonte: rumo a uma certificação',
      paragraphs: [
        'A ambição de longo prazo é levar os alunos que desejarem à obtenção de uma certificação oficial de inglês, reconhecida em nível nacional e internacional.',
        'A AKUU não é uma escola nem pretende sê-lo. Mas ao construir com paciência, ano após ano, um programa sério e adaptado aos moradores de Puerto Miguel, a associação lança as bases de um acesso à educação que pertence de verdade à comunidade e não aos visitantes.'
      ]
    },
    {
      title: 'E hoje?',
      paragraphs: [
        'O projeto foi suspenso com a pandemia de Covid-19, que pôs fim às missões de campo. As bases estão lá, o programa pedagógico existe, e o pedido dos moradores de Puerto Miguel não sumiu. Retomar as aulas de inglês faz parte das prioridades da AKUU para as próximas missões em campo.'
      ]
    }
  ]
}

for (const [rel, block] of [
  ['src/data/hydrama-narrative.json', hydramaPt],
  ['src/data/cours-anglais-narrative.json', coursPt]
]) {
  const filePath = join(root, rel)
  const data = JSON.parse(readFileSync(filePath, 'utf8'))
  data.pt = block
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  console.log('Merged pt (pt-BR) into', rel)
}
