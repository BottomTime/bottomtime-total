import dayjs from 'dayjs';
import { mount } from '@vue/test-utils';
import relativeTime from 'dayjs/plugin/relativeTime';

import IdBadge from '@/components/users/IdBadge.vue';

dayjs.extend(relativeTime);

const BasicProps: Record<string, unknown> = {
  id: 'E5753675-DABF-4846-AC40-2D974EDA0DEE',
  avatar: 'https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50',
  displayName: 'Sandra Logan',
  username: 'slogz99',
  memberSince: new Date('2008-08-23T20:56:45.719Z'),
};

describe('User ID Badge', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2009-11-23T20:56:45.719Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('Will render correctly', () => {
    const wrapper = mount(IdBadge, {
      props: BasicProps,
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('Will show default avatar if none is provided', () => {
    const props = Object.assign({}, BasicProps);
    delete props.avatar;

    const wrapper = mount(IdBadge, { props });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('Will not show display name if it matches the username', () => {
    const wrapper = mount(IdBadge, {
      props: {
        ...BasicProps,
        displayName: BasicProps.username,
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
