interface AnthropicMessageResponse {
  content?: Array<{ text?: string }>;
}

export async function interpretGestures(sequence: string[]): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 80,
      system: `You are JARVIS, the AI assistant of a hand gesture control system.
The user has just performed a sequence of hand gestures.
Respond with ONE short sentence (max 12 words) interpreting what the user
might be trying to communicate or do — be creative, slightly dramatic,
and reference the gesture names. No punctuation at the end. No quotes.`,
      messages: [{
        role: 'user',
        content: `Gesture sequence: ${sequence.join(' → ')}`,
      }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Gesture interpretation request failed (${response.status}).`);
  }

  const data = await response.json() as AnthropicMessageResponse;
  return data.content?.[0]?.text ?? '';
}
