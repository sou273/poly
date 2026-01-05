
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { userDescription, originalDescription, targetLanguage, nativeLanguage } = await request.json();

        if (!userDescription || !originalDescription) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            // MOCK RESPONSE
            console.warn('No GEMINI_API_KEY found. Using mock response.');
            const mockScore = Math.floor(Math.random() * 30) + 70; // 70-100
            return NextResponse.json({
                score: mockScore,
                feedback: "This is a mock feedback because no API key is configured. Your description seems close!",
                feedback: "This is a mock feedback because no API key is configured. Your description seems close!",
                corrections: [
                    originalDescription,
                    "Another way to say it",
                    "A third variation"
                ]
            });
        }

        // REAL RESPONSE using Gemini API
        const prompt = `
      You are a language tutor. 
      The user is learning: ${targetLanguage || 'English'}
      The user's native language is: ${nativeLanguage || 'Japanese'}
      
      Original Description (Correct Meaning): "${originalDescription}"
      User's Description: "${userDescription}"
      
      Task:
      1. Rate the user's description on a scale of 0-10 based on accuracy of meaning and grammar in ${targetLanguage}. 
      2. Provide brief, constructive feedback in ${nativeLanguage}.
      3. Provide 3 native-like, natural alternative ways to express the description in ${targetLanguage}.
         - Ranging from simple to more advanced/natural phrasing.

      Evaluation Guidelines:
　　　　- This is a learning exercise, so technical terminology is not required.
　　　　- A good description should be grammatically correct, use appropriate vocabulary, and allow someone to visualize the illustration based on the explanation.
　　　　- Even if the user's answer contains errors, provide encouraging feedback with a touch of playful humor.
    　- Do not forget the user can't see the description. For example, the description says 'A cute grand piano', the user does not need to reffer it's cute, as it might be hard to see from the picture.

      Return JSON format:
      {
        "score": number,
        "feedback": "string",
        "corrections": ["string", "string", "string"]
      }
    `;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        // Try to parse the JSON from the text response
        // Gemini sometimes wraps code in backticks
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(cleanedText);

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error scoring description:', error);
        return NextResponse.json(
            { error: 'Failed to score description' },
            { status: 500 }
        );
    }
}
