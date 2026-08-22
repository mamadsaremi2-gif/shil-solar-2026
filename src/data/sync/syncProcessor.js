export async function processSyncQueue(syncQueue, handlers = {}) {
  const pending = await syncQueue.pending();
  const report = {
    processed: 0,
    done: 0,
    failed: 0,
    failures: []
  };

  for (const item of pending) {
    const handler = handlers[item.type];

    if (!handler) {
      const failed = await syncQueue.markFailed(item.id, `No sync handler for ${item.type}`);
      report.processed += 1;
      report.failed += 1;
      report.failures.push(failed);
      continue;
    }

    try {
      await handler(item.payload, item);
      await syncQueue.markDone(item.id);
      report.processed += 1;
      report.done += 1;
    } catch (error) {
      const failed = await syncQueue.markFailed(item.id, error);
      report.processed += 1;
      report.failed += 1;
      report.failures.push(failed);
    }
  }

  return report;
}
