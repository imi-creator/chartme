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
            content: `Tu es un expert en création de QCM. Tu dois générer des questions de niveau ${difficulty || 'moyen'} sur le sujet demandé. 
          
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
- Les questions doivent être pertinentes et bien formulées
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
      const questions = JSON.parse(jsonMatch[0]);
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
