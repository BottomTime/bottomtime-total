import { TeamMemberDTO } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import EditTeamMember from 'src/components/operators/editor/edit-team-member.vue';
import UserAvatar from 'src/components/users/user-avatar.vue';
import 'tests/dayjs';
import { BasicUser } from 'tests/fixtures/users';

const TestTeamMember: TeamMemberDTO = {
  member: BasicUser.profile,
  joined: '2019-08-03',
  title: 'Instructor',
} as const;

const SaveButton = '#btn-team-member-save';
const CancelButton = '#btn-team-member-cancel';
const TeamMemberJoined = {
  Year: '#team-member-joined-year',
  Month: '#team-member-joined-month',
  Day: '#team-member-joined-day',
} as const;
const TeamMemberTitle = '#team-member-title';

describe('EditTeamMember component', () => {
  let opts: ComponentMountingOptions<typeof EditTeamMember>;

  beforeEach(() => {
    opts = {
      props: {
        teamMember: TestTeamMember,
      },
    };
  });

  it('will render a team member with all properties set', () => {
    const wrapper = mount(EditTeamMember, opts);
    expect(wrapper.getComponent(UserAvatar).props('profile')).toEqual(
      TestTeamMember.member,
    );
    expect(wrapper.get<HTMLInputElement>(TeamMemberTitle).element.value).toBe(
      TestTeamMember.title,
    );
    expect(
      wrapper.get<HTMLSelectElement>(TeamMemberJoined.Year).element.value,
    ).toBe('2019');
    expect(
      wrapper.get<HTMLSelectElement>(TeamMemberJoined.Month).element.value,
    ).toBe('08');
    expect(
      wrapper.get<HTMLSelectElement>(TeamMemberJoined.Day).element.value,
    ).toBe('03');
  });

  it('will render with optional properties omitted', async () => {
    const wrapper = mount(EditTeamMember, opts);
    await wrapper.setProps({ teamMember: { member: BasicUser.profile } });
    expect(wrapper.get<HTMLInputElement>(TeamMemberTitle).element.value).toBe(
      '',
    );
    expect(
      wrapper.get<HTMLSelectElement>(TeamMemberJoined.Year).element.value,
    ).toBe('');
    expect(wrapper.find(TeamMemberJoined.Month).exists()).toBe(false);
    expect(wrapper.find(TeamMemberJoined.Day).exists()).toBe(false);
  });

  it('will emit a cancel event if user clicks the cancel button', async () => {
    const wrapper = mount(EditTeamMember, opts);
    await wrapper.get(CancelButton).trigger('click');
    expect(wrapper.emitted('cancel')).toEqual([[]]);
  });

  it('will allow a user to save changes to a team member', async () => {
    const expected: TeamMemberDTO = {
      member: BasicUser.profile,
      title: 'Dive Master',
      joined: '2018-07-02',
    };
    const wrapper = mount(EditTeamMember, opts);
    await wrapper.get(TeamMemberTitle).setValue(expected.title);
    await wrapper.get(TeamMemberJoined.Year).setValue('2018');
    await wrapper.get(TeamMemberJoined.Month).setValue('07');
    await wrapper.get(TeamMemberJoined.Day).setValue('02');
    await wrapper.get(SaveButton).trigger('click');
    expect(wrapper.emitted('save')).toEqual([[expected]]);
  });
});
