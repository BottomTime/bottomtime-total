import { mount } from '@vue/test-utils';

import FuzzyDate from 'src/components/common/form-fuzzy-date.vue';

const YearInputSelector = 'select#test-year';
const MonthInputSelector = 'select#test-month';
const DayInputSelector = 'select#test-day';

describe('Fuzzy Date component', () => {
  [
    { name: 'undefined date', value: undefined },
    { name: 'no date', value: '' },
    { name: 'a full date', value: '2021-07-21' },
    { name: 'a year and month', value: '2017-11' },
    { name: 'a year only', value: '2021' },
  ].forEach(({ name, value }) => {
    it(`will initialize with ${name}`, () => {
      const wrapper = mount(FuzzyDate, {
        props: {
          controlId: 'test',
          modelValue: value,
          minYear: 2010,
          maxYear: 2025,
        },
      });
      const parts = value?.split('-') ?? [''];

      const yearInput = wrapper.get<HTMLSelectElement>(YearInputSelector);
      const monthInput = wrapper.find<HTMLSelectElement>(MonthInputSelector);
      const dayInput = wrapper.find<HTMLSelectElement>(DayInputSelector);

      expect(yearInput.element.value).toBe(parts[0]);

      switch (parts.length) {
        case 1:
          if (parts[0] === '') {
            expect(monthInput.exists()).toBe(false);
          } else {
            expect(monthInput.element.value).toBe('');
          }
          expect(dayInput.exists()).toBe(false);
          break;

        case 2:
          expect(monthInput.element.value).toBe(parts[1]);
          expect(dayInput.element.value).toBe('');
          break;

        case 3:
          expect(monthInput.element.value).toBe(parts[1]);
          expect(dayInput.element.value).toBe(parts[2]);
          break;
      }
    });
  });

  [
    { name: 'invalid string', value: 'wazzit?' },
    { name: 'extra characters', value: '2021-07-21T00:00:00Z' },
    { name: 'negative year', value: '-2021-07-21' },
  ].forEach(({ name, value }) => {
    it(`will handle an invalid date: ${name}`, () => {
      const wrapper = mount(FuzzyDate, {
        props: {
          controlId: 'test',
          modelValue: value,
          minYear: 2010,
          maxYear: 2025,
        },
      });

      const yearInput = wrapper.get<HTMLSelectElement>(YearInputSelector);
      const monthInput = wrapper.find<HTMLSelectElement>(MonthInputSelector);
      const dayInput = wrapper.find<HTMLSelectElement>(DayInputSelector);

      expect(yearInput.element.value).toBe('');
      expect(monthInput.exists()).toBe(false);
      expect(dayInput.exists()).toBe(false);
    });
  });

  it('will fix the year if it is out of bounds', async () => {
    const wrapper = mount(FuzzyDate, {
      props: {
        controlId: 'test',
        modelValue: '1650-07-21',
        minYear: 2020,
        maxYear: 2025,
      },
    });

    const yearInput = wrapper.get<HTMLSelectElement>(YearInputSelector);
    expect(yearInput.element.value).toBe('');
  });

  it('will fix the month if it is out of bounds', async () => {
    const wrapper = mount(FuzzyDate, {
      props: {
        controlId: 'test',
        modelValue: '2021-13-21',
        minYear: 2020,
        maxYear: 2025,
      },
    });

    const yearInput = wrapper.get<HTMLSelectElement>(YearInputSelector);
    const monthInput = wrapper.get<HTMLSelectElement>(MonthInputSelector);

    expect(yearInput.element.value).toBe('2021');
    expect(monthInput.element.value).toBe('');
  });

  it('will fix the day if it is out of bounds', async () => {
    const wrapper = mount(FuzzyDate, {
      props: {
        controlId: 'test',
        modelValue: '2021-02-29',
        minYear: 2020,
        maxYear: 2025,
      },
    });

    const yearInput = wrapper.get<HTMLSelectElement>(YearInputSelector);
    const monthInput = wrapper.get<HTMLSelectElement>(MonthInputSelector);
    const dayInput = wrapper.get<HTMLSelectElement>(DayInputSelector);

    expect(yearInput.element.value).toBe('2021');
    expect(monthInput.element.value).toBe('02');
    expect(dayInput.element.value).toBe('');
  });

  it('will allow the min and max years to be set', () => {
    const wrapper = mount(FuzzyDate, {
      props: {
        controlId: 'test',
        modelValue: '2021-07-21',
        minYear: 2020,
        maxYear: 2025,
      },
    });

    const yearInput = wrapper.get<HTMLSelectElement>(YearInputSelector);

    expect(yearInput.text()).toMatchSnapshot();
  });

  it('will display the month select if the year is set', async () => {
    const wrapper = mount(FuzzyDate, {
      props: {
        controlId: 'test',
        modelValue: '',
        minYear: 2020,
        maxYear: 2025,
      },
    });

    const yearInput = wrapper.get<HTMLSelectElement>(YearInputSelector);
    await yearInput.setValue('2021');

    const monthInput = wrapper.find<HTMLSelectElement>(MonthInputSelector);
    expect(monthInput.isVisible()).toBe(true);
    expect(wrapper.emitted('update:modelValue')).toEqual([['2021']]);
  });

  it('will display the day select if the month is set', async () => {
    const wrapper = mount(FuzzyDate, {
      props: {
        controlId: 'test',
        modelValue: '2021',
        minYear: 2020,
        maxYear: 2025,
      },
    });

    const monthInput = wrapper.get<HTMLSelectElement>(MonthInputSelector);
    await monthInput.setValue('07');

    const dayInput = wrapper.find<HTMLSelectElement>(DayInputSelector);
    expect(dayInput.isVisible()).toBe(true);
    expect(wrapper.emitted('update:modelValue')).toEqual([['2021-07']]);
  });

  it('will update the value if the day is set', async () => {
    const wrapper = mount(FuzzyDate, {
      props: {
        controlId: 'test',
        modelValue: '2021-07',
        minYear: 2020,
        maxYear: 2025,
      },
    });

    const dayInput = wrapper.get<HTMLSelectElement>(DayInputSelector);
    await dayInput.setValue('21');

    expect(wrapper.emitted('update:modelValue')).toEqual([['2021-07-21']]);
  });

  it('will hide the day if the month is cleared', async () => {
    const wrapper = mount(FuzzyDate, {
      props: {
        controlId: 'test',
        modelValue: '2021-07-21',
        minYear: 2020,
        maxYear: 2025,
      },
    });

    const monthInput = wrapper.get<HTMLSelectElement>(MonthInputSelector);
    await monthInput.setValue('');

    const dayInput = wrapper.find<HTMLSelectElement>(DayInputSelector);
    expect(dayInput.exists()).toBe(false);
    expect(wrapper.emitted('update:modelValue')).toEqual([['2021'], ['2021']]);
  });

  it('will hide the month and day if the year is cleared', async () => {
    const wrapper = mount(FuzzyDate, {
      props: {
        controlId: 'test',
        modelValue: '2021-07-21',
        minYear: 2020,
        maxYear: 2025,
      },
    });

    const yearInput = wrapper.get<HTMLSelectElement>(YearInputSelector);
    await yearInput.setValue('');

    const monthInput = wrapper.find<HTMLSelectElement>(MonthInputSelector);
    const dayInput = wrapper.find<HTMLSelectElement>(DayInputSelector);
    expect(monthInput.exists()).toBe(false);
    expect(dayInput.exists()).toBe(false);
    expect(wrapper.emitted('update:modelValue')).toEqual([[''], ['']]);
  });

  it('will clear the day, when necessary, if month is changed to a shorter month', async () => {
    const wrapper = mount(FuzzyDate, {
      props: {
        controlId: 'test',
        modelValue: '2021-07-31',
        minYear: 2020,
        maxYear: 2025,
      },
    });

    const monthInput = wrapper.get<HTMLSelectElement>(MonthInputSelector);
    await monthInput.setValue('04');

    const dayInput = wrapper.get<HTMLSelectElement>(DayInputSelector);
    expect(dayInput.element.value).toBe('');
  });
});
