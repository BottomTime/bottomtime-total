import {
  ListAlertsResponseDTO,
  ListAlertsResponseSchema,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  mount,
  renderToString,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { Alert, ApiClient, ApiClientKey } from '../../../../src/client';
import AlertsCarouselItem from '../../../../src/components/home/alerts-carousel-item.vue';
import AlertsCarousel from '../../../../src/components/home/alerts-carousel.vue';
import { useInitialState } from '../../../../src/initial-state';
import AlertData from '../../../fixtures/alerts.json';
import { createRouter } from '../../../fixtures/create-router';

jest.mock('../../../../src/initial-state');

const NextButton = 'button[data-testid="carousel-next"]';
const PreviousButton = 'button[data-testid="carousel-prev"]';
const CarouselIndicators = 'div[data-testid="carousel-indicators"]';

describe('Alerts Carousel component', () => {
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let alertData: ListAlertsResponseDTO;
  let options: ComponentMountingOptions<typeof AlertsCarousel>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter();
  });

  beforeEach(() => {
    pinia = createPinia();
    alertData = ListAlertsResponseSchema.parse(AlertData);
    alertData.alerts = alertData.alerts.slice(0, 10);
    jest.mocked(useInitialState).mockImplementation(() => ({
      currentUser: null,
      alerts: alertData,
    }));

    options = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
  });

  it('will prefetch alerts on SSR', async () => {
    const spy = jest.spyOn(client.alerts, 'listAlerts').mockResolvedValue({
      alerts: alertData.alerts
        .slice(0, 10)
        .map((dto) => new Alert(client.axios, dto)),
      totalCount: alertData.totalCount,
    });

    const html = await renderToString(AlertsCarousel, {
      global: options.global,
    });

    expect(spy).toHaveBeenCalledWith({ showDismissed: false });
    alertData.alerts.slice(0, 10).forEach((dto) => {
      expect(html).toContain(dto.title);
    });
  });

  it('will render with several alerts', () => {
    const wrapper = mount(AlertsCarousel, options);
    const content = wrapper.get('[data-testid="carousel-content"]');
    expect(content.isVisible()).toBe(true);

    const contentPanels = content.findAllComponents(AlertsCarouselItem);
    expect(contentPanels).toHaveLength(10);

    for (let i = 0; i < 10; i++) {
      expect(contentPanels.at(i).text()).toContain(alertData.alerts[i].title);
    }

    expect(wrapper.get(NextButton).isVisible()).toBe(true);
    expect(wrapper.get(PreviousButton).isVisible()).toBe(true);
    expect(wrapper.get(CarouselIndicators).isVisible()).toBe(true);
  });

  it('will render with a single alert', async () => {
    alertData.alerts = alertData.alerts.slice(0, 1);
    const wrapper = mount(AlertsCarousel, options);
    const content = wrapper.get('[data-testid="carousel-content"]');
    expect(content.isVisible()).toBe(true);

    const contentPanels = content.findAllComponents(AlertsCarouselItem);
    expect(contentPanels).toHaveLength(1);
    expect(contentPanels.at(0).text()).toContain(alertData.alerts[0].title);

    expect(wrapper.find(NextButton).exists()).toBe(false);
    expect(wrapper.find(PreviousButton).exists()).toBe(false);
    expect(wrapper.find(CarouselIndicators).exists()).toBe(false);
  });

  it('will not render if there are no alerts', () => {
    alertData.alerts = [];
    const wrapper = mount(AlertsCarousel, options);
    expect(wrapper.isVisible()).toBe(false);
  });
});
