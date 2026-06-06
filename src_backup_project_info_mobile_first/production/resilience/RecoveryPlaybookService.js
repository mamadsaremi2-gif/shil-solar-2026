export class RecoveryPlaybookService {
  constructor() {
    this.playbooks = {
      STORAGE_FAILURE: [
        "Switch to memory fallback storage.",
        "Create emergency export if possible.",
        "Prompt user to retry after storage check."
      ],
      SYNC_FAILURE: [
        "Pause remote sync.",
        "Keep operations in offline queue.",
        "Retry with exponential backoff."
      ],
      CALCULATION_FAILURE: [
        "Save project snapshot.",
        "Attach error diagnostics.",
        "Allow user to return to last valid step."
      ],
      BACKUP_FAILURE: [
        "Retry backup creation.",
        "Verify storage capacity.",
        "Run data integrity manifest."
      ]
    };
  }

  get(code) {
    return this.playbooks[code] || [
      "Capture error context.",
      "Save current state.",
      "Retry operation if safe."
    ];
  }

  list() {
    return { ...this.playbooks };
  }
}
