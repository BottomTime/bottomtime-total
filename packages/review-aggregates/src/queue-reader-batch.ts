export class QueueReaderBatch {
  get logEntryIds(): Set<string> {
    return new Set();
  }

  get diveSiteIds(): Set<string> {
    return new Set();
  }

  async finalize(): Promise<void> {}
}
