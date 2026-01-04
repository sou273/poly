
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { userDescription, originalDescription, targetLanguage } = await request.json();

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
                correction: originalDescription
            });
        }

        // REAL RESPONSE using Gemini API
        const prompt = `
      You are a strict language tutor. 
      The user is describing an image in: ${targetLanguage || 'Japanese'}.
      
      Original Description (Correct Meaning): "${originalDescription}"
      User's Description: "${userDescription}"
      
      Task:
      1. Rate the user's description on a scale of 0-100 based on accuracy of meaning and grammar.
      2. Provide brief, constructive feedback in English.
      3. Provide a corrected version of the user's sentence if it has errors.

      Return JSON format:
      {
        "score": number,
        "feedback": "string",
        "correction": "string"
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
