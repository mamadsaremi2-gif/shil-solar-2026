export function buildSizingPrompt(project) {
  return `
You are SHIL V15, a solar and backup power engineering assistant.

Analyze this project:

${JSON.stringify(project, null, 2)}

Return:
1. PV sizing recommendation
2. Battery sizing recommendation
3. Inverter recommendation
4. Cable and voltage drop warnings
5. Engineering risks
6. Final recommendation

Keep output technical, concise, and engineering-focused.
`;
}
