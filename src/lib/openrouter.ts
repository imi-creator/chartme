const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export async function generateQuestions(
  topic: string,
  numberOfQuestions: number = 10,
  difficulty: 'facile' | 'moyen' | 'difficile' = 'moyen'
): Promise<Question[]> {
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
          content: `Tu es un expert en création de QCM. Tu dois générer des questions de niveau ${difficulty} sur le sujet demandé. 
          
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
- Les questions doivent être pertinentes et bien formulées`
        },
        {
          role: 'user',
          content: `Génère ${numberOfQuestions} questions QCM sur le sujet suivant: ${topic}`
        }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No content in response');
  }

  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }
    const questions = JSON.parse(jsonMatch[0]) as Question[];
    return questions;
  } catch (e) {
    console.error('Failed to parse questions:', content);
    throw new Error('Failed to parse generated questions');
  }
}
