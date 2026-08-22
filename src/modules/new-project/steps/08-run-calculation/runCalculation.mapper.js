export function mapResultToFinalProject(result) {
  return {
    status: result?.ok ? "completed" : "error",
    result,
  };
}
