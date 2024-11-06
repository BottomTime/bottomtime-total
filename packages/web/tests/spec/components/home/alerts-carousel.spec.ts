import {
  Fetcher,
  ListAlertsResponseDTO,
  ListAlertsResponseSchema,
} from '@bottomtime/api';
import { Alert, ApiClient } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import AlertsCarouselItem from '../../../../src/components/home/alerts-carousel-item.vue';
import AlertsCarousel from '../../../../src/components/home/alerts-carousel.vue';
import { useCurrentUser } from '../../../../src/store';
import AlertData from '../../../fixtures/alerts.json';
import { createRouter } from '../../../fixtures/create-router';

const NextButton = 'button[data-testid="carousel-next"]';
const PreviousButton = 'button[data-testid="carousel-prev"]';
const CarouselIndicators = 'div[data-testid="carousel-indicators"]';

describe('Alerts Carousel component', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let alertData: ListAlertsResponseDTO;
  let options: ComponentMountingOptions<typeof AlertsCarousel>;
  let fetchSpy: jest.SpyInstance;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    router = createRouter();
  });

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);

    alertData = ListAlertsResponseSchema.parse(AlertData);
    alertData.alerts = alertData.alerts.slice(0, 10);
    currentUser.user = null;

    options = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
  });

  it('will fetch alerts when component is mounted', async () => {
    fetchSpy = jest.spyOn(client.alerts, 'listAlerts').mockResolvedValue({
      alerts: alertData.alerts.map((dto) => new Alert(fetcher, dto)),
      totalCount: alertData.totalCount,
    });
    const wrapper = mount(AlertsCarousel, options);
    await flushPromises();

    expect(fetchSpy).toHaveBeenCalledWith({ showDismissed: false });
    const alerts = wrapper.findAllComponents(AlertsCarouselItem);
    expect(alerts).toHaveLength(alertData.alerts.length);
    alerts.forEach((alert, index) => {
      expect(alert.props('alert')).toEqual(alertData.alerts[index]);
    });

    expect(wrapper.get(NextButton).isVisible()).toBe(true);
    expect(wrapper.get(PreviousButton).isVisible()).toBe(true);
    expect(wrapper.get(CarouselIndicators).isVisible()).toBe(true);
  });

  it('will render with a single alert', async () => {
    fetchSpy = jest.spyOn(client.alerts, 'listAlerts').mockResolvedValue({
      alerts: alertData.alerts
        .slice(0, 1)
        .map((dto) => new Alert(fetcher, dto)),
      totalCount: alertData.totalCount,
    });
    const wrapper = mount(AlertsCarousel, options);
    await flushPromises();

    expect(fetchSpy).toHaveBeenCalledWith({ showDismissed: false });
    const alerts = wrapper.findAllComponents(AlertsCarouselItem);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].props('alert')).toEqual(alertData.alerts[0]);

    expect(wrapper.find(NextButton).exists()).toBe(false);
    expect(wrapper.find(PreviousButton).exists()).toBe(false);
    expect(wrapper.find(CarouselIndicators).exists()).toBe(false);
  });

  it('will not render if there are no alerts', async () => {
    fetchSpy = jest
      .spyOn(client.alerts, 'listAlerts')
      .mockResolvedValue({ alerts: [], totalCount: 0 });
    const wrapper = mount(AlertsCarousel, options);
    await flushPromises();

    expect(fetchSpy).toHaveBeenCalledWith({ showDismissed: false });
    const alerts = wrapper.findAllComponents(AlertsCarouselItem);
    expect(alerts).toHaveLength(0);

    expect(wrapper.find(NextButton).exists()).toBe(false);
    expect(wrapper.find(PreviousButton).exists()).toBe(false);
    expect(wrapper.find(CarouselIndicators).exists()).toBe(false);
  });
});
