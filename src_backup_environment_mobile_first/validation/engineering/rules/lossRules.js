import { error, warning } from "../validationMessage.js";

export function validateLossRules(form) {
  const messages = [];
  const { environment } = form;

  const totalLoss =
    environment.irradianceLossPercent +
    environment.soilingLossPercent +
    environment.shadingLossPercent;

  if (totalLoss < 0) {
    messages.push(error("environment.losses", "Loss values cannot be negative."));
  }

  if (totalLoss > 35) {
    messages.push(warning("environment.losses", "Total environmental losses are high; verify site assumptions."));
  }

  return messages;
}
