import { evaluate } from "mathjs";

export function calculateExpression(
  expression
) {

  try {

    return evaluate(expression);

  } catch {

    return null;

  }
}
