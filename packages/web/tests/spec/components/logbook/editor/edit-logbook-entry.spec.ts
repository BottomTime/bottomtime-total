import { ApiClient, LogEntryDTO, TankDTO, TankSchema } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../../src/api-client';
import EditLogbookEntry from '../../../../../src/components/logbook/editor/edit-logbook-entry.vue';
import { createRouter } from '../../../../fixtures/create-router';
import {
  FullLogEntry,
  MinimalLogEntry,
} from '../../../../fixtures/log-entries';
import TankData from '../../../../fixtures/tanks.json';

dayjs.extend(utc);
dayjs.extend(tz);

describe('Log entry editor', () => {
  let client: ApiClient;
  let router: Router;
  let tankData: TankDTO[];

  let pinia: Pinia;

  function getOpts(
    entry: LogEntryDTO,
  ): ComponentMountingOptions<typeof EditLogbookEntry> {
    pinia = createPinia();
    return {
      props: {
        entry,
        tanks: tankData,
      },
      global: {
        provide: {
          [ApiClientKey as symbol]: client,
        },
        plugins: [pinia, router],
        stubs: {
          teleport: true,
        },
      },
    };
  }

  beforeAll(() => {
    client = new ApiClient();
    tankData = TankSchema.array().parse(TankData.data).slice(0, 5);
    router = createRouter();
  });

  describe('when mounting with a logbook entry', () => {
    it('will mount', () => {
      mount(EditLogbookEntry, getOpts(MinimalLogEntry));
    });
  });

  describe('when validating input', () => {});

  describe('when saving changes', () => {});
});
