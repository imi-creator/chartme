import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { topic, numberOfQuestions, difficulty } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'Le sujet est requis' }, { status: 400 });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en évaluation de compétences professionnelles et création de QCM. Tu dois générer des questions de niveau ${difficulty || 'moyen'} sur le sujet demandé.

OBJECTIF: Créer un test qui mesure précisément le niveau de compétence d'un professionnel sur le thème donné.

RÈGLES DE CONCEPTION:
- Les questions doivent évaluer des compétences concrètes et applicables en contexte professionnel
- Inclure un mix de questions théoriques ET pratiques (cas concrets, mises en situation)
- Les mauvaises réponses doivent être plausibles (erreurs courantes de professionnels moins expérimentés)
- Varier les types de questions: définitions, application, analyse, résolution de problèmes
- Adapter la complexité au niveau demandé (facile = bases, moyen = maîtrise, difficile = expertise)

Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après. Le format doit être exactement:
[
  {
    "id": "q1",
    "question": "La question ici",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0
  }
]

- correctAnswer est l'index (0-3) de la bonne réponse dans le tableau options
- Chaque question doit avoir exactement 4 options
- IMPORTANT: Varie la position de la bonne réponse ! Répartis les bonnes réponses de manière équilibrée entre les positions 0, 1, 2 et 3.
- Génère exactement ${numberOfQuestions || 10} questions`
          },
          {
            role: 'user',
            content: `Génère ${numberOfQuestions || 10} questions QCM sur le sujet suivant: ${topic}`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter API error:', error);
      return NextResponse.json({ error: 'Erreur de génération IA' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: 'Pas de contenu dans la réponse' }, { status: 500 });
    }

    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      const rawQuestions = JSON.parse(jsonMatch[0]);
      
      // Mélanger les options de chaque question pour éviter que la bonne réponse soit toujours à la même position
      const questions = rawQuestions.map((q: { id: string; question: string; options: string[]; correctAnswer: number }) => {
        const correctOption = q.options[q.correctAnswer];
        const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
        const newCorrectAnswer = shuffledOptions.indexOf(correctOption);
        return {
          ...q,
          options: shuffledOptions,
          correctAnswer: newCorrectAnswer,
        };
      });
      
      return NextResponse.json({ questions });
    } catch (e) {
      console.error('Failed to parse questions:', content);
      return NextResponse.json({ error: 'Erreur de parsing des questions' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
