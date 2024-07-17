import { CreateOrUpdateLogEntryParamsDTO, DepthUnit } from '@bottomtime/api';

import dayjs from 'dayjs';

import { expect, test } from '../fixtures';

const Username = 'Johnny_Diver';
const Password = 'P@ssw0rd__';

const TestData: CreateOrUpdateLogEntryParamsDTO = {
  duration: 99,
  bottomTime: 82,
  maxDepth: {
    depth: 93,
    unit: DepthUnit.Feet,
  },
  entryTime: {
    date: '2022-04-23T09:18:13',
    timezone: 'Asia/Bangkok',
  },
  logNumber: 22,
  notes: 'Yipeeee!!',
};

test.describe('Log Entries', () => {
  test.beforeEach(async ({ api, auth }) => {
    await api.users.createUser({
      username: Username,
      password: Password,
    });
    await auth.login(Username, Password);
  });

  test('will allow a user to create a log entry', async ({
    api,
    page,
    logEntries,
  }) => {
    await logEntries.gotoLogEntries(Username);
    await page.getByRole('button', { name: 'Create Entry' }).click();
    await page.waitForURL(`**/logbook/${Username}/new`);

    await expect(page.getByTestId('log-number')).toHaveValue('1');
    await page.getByTestId('log-number').clear();
    await page.getByTestId('log-number').fill(TestData.logNumber!.toString());
    await page
      .getByPlaceholder('Select entry time')
      .fill(dayjs(TestData.entryTime.date).format('YYYY-MMM-DD hh:mm:ss A'));
    await page.getByPlaceholder('Select entry time').press('Tab');
    await page
      .getByTestId('entry-time-timezone')
      .selectOption(TestData.entryTime.timezone);
    await page.getByTestId('duration').fill(TestData.duration!.toString());
    await page.getByTestId('bottomTime').fill(TestData.bottomTime!.toString());
    await page
      .getByTestId('max-depth')
      .fill(TestData.maxDepth!.depth!.toString());
    await page.getByTestId('max-depth-unit').click();
    await page.getByTestId('notes').fill(TestData.notes!);
    await page.getByTestId('save-entry').click();

    await page.waitForURL(new RegExp(`.*/logbook/${Username}/(?!new).*`));

    const logEntryId = page.url().split('/').pop()!;
    const entry = await api.logEntries.getLogEntry(Username, logEntryId);
    expect(entry.logNumber).toBe(TestData.logNumber);
    expect(entry.entryTime.date).toBe(TestData.entryTime.date);
    expect(entry.entryTime.timezone).toBe(TestData.entryTime.timezone);
    expect(entry.duration).toBe(TestData.duration);
    expect(entry.bottomTime).toBe(TestData.bottomTime);
    expect(entry.maxDepth?.depth).toBe(TestData.maxDepth!.depth);
    expect(entry.maxDepth?.unit).toBe(TestData.maxDepth!.unit);
    expect(entry.notes).toBe(TestData.notes);

    await expect(page.getByTestId('log-number')).toHaveValue(
      TestData.logNumber!.toString(),
    );
    await expect(page.getByPlaceholder('Select entry time')).toHaveValue(
      dayjs(TestData.entryTime.date).format('YYYY-MMM-DD hh:mm:ss A'),
    );
    await expect(page.getByTestId('entry-time-timezone')).toHaveValue(
      TestData.entryTime.timezone,
    );
    await expect(page.getByTestId('duration')).toHaveValue(
      TestData.duration!.toString(),
    );
    await expect(page.getByTestId('bottomTime')).toHaveValue(
      TestData.bottomTime!.toString(),
    );
    await expect(page.getByTestId('max-depth')).toHaveValue(
      TestData.maxDepth!.depth.toString(),
    );
    await expect(page.getByTestId('max-depth-unit')).toContainText('ft');
    await expect(page.getByTestId('notes')).toHaveValue(TestData.notes!);
  });

  test('will allow a user to search for and navigate to a log entry', async ({
    api,
    logEntries,
    page,
  }) => {
    const entry = await api.logEntries.createLogEntry(Username, TestData);

    await logEntries.gotoLogEntries(Username);
    await logEntries.performSearch({
      query: '', // TODO: Update this once we have full text indexing on logs table.
      startDate: new Date('2022-04-01'),
      endDate: new Date('2022-05-01'),
    });

    await page.getByTestId(`select-${entry.id}`).click();
    await page.getByTestId('drawer-fullscreen').getByRole('button').click();

    await page.waitForURL(`**/logbook/${Username}/${entry.id}`);

    await expect(page.getByTestId('log-number')).toHaveValue(
      TestData.logNumber!.toString(),
    );
    await expect(page.getByPlaceholder('Select entry time')).toHaveValue(
      dayjs(TestData.entryTime.date).format('YYYY-MMM-DD hh:mm:ss A'),
    );
    await expect(page.getByTestId('entry-time-timezone')).toHaveValue(
      TestData.entryTime.timezone,
    );
    await expect(page.getByTestId('duration')).toHaveValue(
      TestData.duration!.toString(),
    );
    await expect(page.getByTestId('bottomTime')).toHaveValue(
      TestData.bottomTime!.toString(),
    );
    await expect(page.getByTestId('max-depth')).toHaveValue(
      TestData.maxDepth!.depth.toString(),
    );
    await expect(page.getByTestId('max-depth-unit')).toContainText('ft');
    await expect(page.getByTestId('notes')).toHaveValue(TestData.notes!);
  });

  test('will allow a user to edit a log entry', async ({
    api,
    logEntries,
    page,
  }) => {
    const newLogNumber = 44;
    const newEntryTime = '2022-04-09T09:18:13';
    const newTimezone = 'Africa/Abidjan';
    const newDuration = 88.3;
    const newBottomTime = 66.2;
    const newMaxDepth = 44.5;
    const newNotes = 'This dive was amazing!';

    const entry = await api.logEntries.createLogEntry(Username, TestData);
    await logEntries.gotoLogEntry(Username, entry.id);

    await page.getByTestId('log-number').fill(newLogNumber.toString());
    await page.getByLabel('Datepicker input').fill(newEntryTime);
    await page.getByTestId('entry-time-timezone').click();
    await page.getByTestId('entry-time-timezone').selectOption(newTimezone);
    await page.getByTestId('duration').fill(newDuration.toString());
    await page.getByTestId('bottomTime').fill(newBottomTime.toString());
    await page.getByTestId('max-depth').fill(newMaxDepth.toString());
    await page.getByTestId('max-depth-unit').click();
    await page.getByTestId('notes').fill(newNotes);
    await page.getByTestId('save-entry').click();

    await page.waitForSelector('[data-testid="toast-log-entry-saved"]');

    const updated = await api.logEntries.getLogEntry(Username, entry.id);
    expect(updated.bottomTime).toBe(newBottomTime);
    expect(updated.duration).toBe(newDuration);
    expect(updated.entryTime.date).toBe(newEntryTime);
    expect(updated.entryTime.timezone).toBe(newTimezone);
    expect(updated.logNumber).toBe(newLogNumber);
    expect(updated.maxDepth?.depth).toBe(newMaxDepth);
    expect(updated.maxDepth?.unit).toBe(DepthUnit.Meters);
    expect(updated.notes).toBe(newNotes);
  });

  test('will allow a user to use a recently-used dive site', async ({
    api,
    logEntries,
    page,
  }) => {
    const site = await api.diveSites.createDiveSite({
      location: 'Lake Town',
      name: 'Epic Dive Site',
    });
    await api.logEntries.createLogEntry(Username, {
      duration: 99,
      entryTime: {
        date: '2022-04-23T09:18:13',
        timezone: 'Asia/Bangkok',
      },
      site: site.id,
    });
    const entry = await api.logEntries.createLogEntry(Username, TestData);

    await logEntries.gotoLogEntry(Username, entry.id);

    await page.getByTestId('btn-select-site').click();
    await logEntries.selectSiteFromList(site.id);
    await expect(page.getByTestId('btn-site-name')).toHaveText(site.name);

    await page.getByTestId('save-entry').click();
    await page.waitForSelector('[data-testid="toast-log-entry-saved"]');

    const result = await api.logEntries.getLogEntry(Username, entry.id);
    expect(result?.site?.name).toBe(site.name);
  });

  test('will allow a user to search for an existing dive site', async ({
    api,
    logEntries,
    page,
  }) => {
    const site = await api.diveSites.createDiveSite({
      location: 'Lake Town',
      name: 'Epic Dive Site',
    });
    const entry = await api.logEntries.createLogEntry(Username, TestData);

    await logEntries.gotoLogEntry(Username, entry.id);

    await page.getByTestId('btn-select-site').click();
    await page.getByTestId('tab-search').click();
    await page.getByTestId('site-search-query').fill('lake');
    await page.getByTestId('site-search-query').press('Enter');
    await logEntries.selectSiteFromList(site.id);

    await page.getByTestId('save-entry').click();
    await page.waitForSelector('[data-testid="toast-log-entry-saved"]');

    const result = await api.logEntries.getLogEntry(Username, entry.id);
    expect(result?.site?.name).toBe(site.name);
  });

  test('will allow a user to create a new dive site', async ({
    api,
    logEntries,
    page,
  }) => {
    const entry = await api.logEntries.createLogEntry(Username, TestData);
    const siteName = 'Dahab Blue Hole';
    await logEntries.gotoLogEntry(Username, entry.id);

    await page.getByTestId('btn-select-site').click();
    await page.getByTestId('tab-create').click();
    await page.getByTestId('new-site-location').fill('Dahab, Egypt');
    await page.getByTestId('new-site-lat').fill('28.5717821');
    await page.getByTestId('new-site-lon').fill('34.5600764');
    await page
      .getByTestId('new-site-directions')
      .fill('Fly to Egypt. Go diving.');
    await page.getByTestId('new-site-name').fill(siteName);
    await page.getByTestId('new-site-depth-bottomless').check();
    await page.getByTestId('new-site-description').fill('Epic hole');
    await page.getByTestId('free-to-dive-true').click();
    await page.getByTestId('shore-access-true').click();
    await page.getByTestId('save-new-site').click();
    await page.waitForSelector('[data-testid="drawer-panel"]', {
      state: 'hidden',
    });

    await page.getByTestId('save-entry').click();
    await page.waitForSelector('[data-testid="toast-log-entry-saved"]');

    const result = await api.logEntries.getLogEntry(Username, entry.id);
    expect(result?.site?.name).toBe(siteName);
  });
});
