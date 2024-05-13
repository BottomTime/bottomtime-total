import {
  ListLogEntriesParamsDTO,
  LogEntrySortBy,
  SortOrder,
} from '@bottomtime/api';

import { Page } from '@playwright/test';

export class LogEntriesFixture {
  constructor(private readonly page: Page) {}

  async gotoLogEntries(username: string): Promise<void> {
    await this.page.goto(`/logbook/${username}`);
    await this.page.waitForURL(`**/logbook/${username}`);
  }

  async gotoNewLogEntry(username: string): Promise<void> {
    await this.page.goto(`/logbook/${username}/new`);
    await this.page.waitForURL(`**/logbook/${username}/new`);
  }

  async gotoLogEntry(username: string, id: string): Promise<void> {
    await this.page.goto(`/logbook/${username}/${id}`);
    await this.page.waitForURL(`**/logbook/${username}/${id}`);
  }

  async performSearch(options: ListLogEntriesParamsDTO): Promise<void> {
    await this.page.getByTestId('search-query').fill(options.query || '');

    const startDate = this.page.getByPlaceholder('Show entries after...');
    const endDate = this.page.getByPlaceholder('Show entries before...');

    await startDate.fill(
      options.startDate ? new Date(options.startDate).toISOString() : '',
    );
    await startDate.press('Enter');

    await endDate.fill(
      options.endDate ? new Date(options.endDate).toISOString() : '',
    );
    await endDate.press('Enter');

    await this.page.getByTestId('btn-search').click();
    await this.page.waitForURL(`**/logbook/*`);
  }

  async changeSortOrder(
    sortBy: LogEntrySortBy,
    sortOrder: SortOrder,
  ): Promise<void> {
    await this.page
      .getByTestId('entries-sort-order')
      .selectOption(`${sortBy}-${sortOrder}`);
  }
}
