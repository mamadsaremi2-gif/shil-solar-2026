export function createDraft(form) {
  return {
    id: crypto.randomUUID(),
    status: "draft",
    form,
    updatedAt: new Date().toISOString(),
  };
}
