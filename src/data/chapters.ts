export interface Question {
  id: number;
  text: string;
}

export interface Chapter {
  id: number;
  title: string;
  summary: string;
  content: string;
  audioUrl: string;
  questions: Question[];
}

export const chapters: Chapter[] = [
  {
    id: 1,
    title: 'A Crise Final da Terra',
    summary: 'Uma visão panorâmica dos eventos que precedem a volta de Cristo.',
    content:
      'O mundo está em crise. Eventos terríveis e solenes estão para ocorrer diante de nós. A humanidade está à beira de uma grande catástrofe...',
    audioUrl: 'https://example.com/audio/cap1.mp3',
    questions: [
      { id: 101, text: 'O que caracteriza a crise final descrita no capítulo?' },
      { id: 102, text: 'Como devemos nos preparar para os eventos que virão?' },
    ],
  },
  {
    id: 2,
    title: 'Sinais da Breve Volta de Cristo',
    summary: 'Identificando os sinais nos céus e na terra.',
    content:
      'Os sinais da segunda vinda de Cristo estão se cumprindo rapidamente. Guerras, fomes, terremotos e o aumento do pecado...',
    audioUrl: 'https://example.com/audio/cap2.mp3',
    questions: [
      { id: 201, text: 'Quais sinais você observa no mundo hoje?' },
      { id: 202, text: 'Qual a importância de discernir os sinais dos tempos?' },
    ],
  },
  {
    id: 3,
    title: '"Quando Estas Coisas Começarem a Suceder"',
    summary: 'A atitude do cristão diante do início das tribulações.',
    content:
      'Jesus nos exortou a olhar para cima quando víssemos essas coisas. Não devemos temer, mas confiar na promessa de Sua volta...',
    audioUrl: 'https://example.com/audio/cap3.mp3',
    questions: [{ id: 301, text: 'Como manter a paz em meio à confusão mundial?' }],
  },
  // Add more chapters as placeholders up to 20
];

// Dynamically generate the rest if needed or leave as placeholders
for (let i = 4; i <= 20; i++) {
  if (!chapters.find((c) => c.id === i)) {
    chapters.push({
      id: i,
      title: `Capítulo ${i}: Título do Estudo`,
      summary: `Resumo do capítulo ${i} sobre os eventos finais.`,
      content: `Conteúdo completo do capítulo ${i}...`,
      audioUrl: `https://example.com/audio/cap${i}.mp3`,
      questions: [
        { id: i * 100 + 1, text: 'Pergunta de reflexão 1?' },
        { id: i * 100 + 2, text: 'Pergunta de reflexão 2?' },
      ],
    });
  }
}
