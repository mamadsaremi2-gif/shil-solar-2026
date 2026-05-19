export function assistantSuggest(project) {

  const suggestions = [];

  if(project?.environment?.temperature > 35) {
    suggestions.push("دمای محیط بالاست؛ تهویه تجهیزات بررسی شود.");
  }

  if(project?.calculations?.estimatedLoad > 10000) {
    suggestions.push("بار مصرفی سنگین است؛ ظرفیت اینورتر بازبینی شود.");
  }

  if(project?.equipment?.suggestedPanels > 20) {
    suggestions.push("آرایه پنل نیازمند طراحی استراکچر صنعتی است.");
  }

  return suggestions;
}
