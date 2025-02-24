import {
  AccountTier,
  ApiClient,
  ApiList,
  LogBookSharing,
  TeamMemberDTO,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { ApiClientKey } from 'src/api-client';
import EditTeamMember from 'src/components/operators/editor/edit-team-member.vue';
import EditTeamMembers from 'src/components/operators/editor/edit-team-members.vue';
import TeamMemberListItem from 'src/components/operators/team-member-list-item.vue';
import SearchProfiles from 'src/components/users/profiles/search-profiles.vue';
import 'tests/dayjs';
import { PartialOperator } from 'tests/fixtures/operators';
import {
  BasicUser,
  UserWithEmptyProfile,
  UserWithFullProfile,
} from 'tests/fixtures/users';

const TeamMembers: ApiList<TeamMemberDTO> = {
  data: [
    {
      member: BasicUser.profile,
      title: 'Instructor',
      joined: '2019-08-03',
    },
    {
      member: UserWithEmptyProfile.profile,
      title: 'Assistant Instructor',
      joined: '2020-01-01',
    },
    {
      member: UserWithFullProfile.profile,
      title: 'Dive Master',
      joined: '2020-02-02',
    },
  ],
  totalCount: 3,
};

const AddTeamMemberButton = '#btn-add-team-member';

describe('EditTeamMembers component', () => {
  let client: ApiClient;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof EditTeamMembers>;
  let listTeamMembersSpy: jest.SpyInstance;

  beforeAll(() => {
    client = new ApiClient();
  });

  beforeEach(() => {
    pinia = createPinia();
    opts = {
      props: {
        operator: PartialOperator,
      },
      global: {
        plugins: [pinia],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: {
          teleport: true,
        },
      },
    };

    listTeamMembersSpy = jest
      .spyOn(client.operators, 'listTeamMembers')
      .mockResolvedValue(TeamMembers);
  });

  it('will mount and display a list of team members', async () => {
    const wrapper = mount(EditTeamMembers, opts);
    await flushPromises();

    expect(listTeamMembersSpy).toHaveBeenCalledWith(PartialOperator.slug);
    const members = await wrapper.findAllComponents(TeamMemberListItem);
    expect(members).toHaveLength(TeamMembers.data.length);
    members.forEach((member, index) => {
      expect(member.props('teamMember')).toEqual(TeamMembers.data[index]);
    });
  });

  it('will allow a user to add a new team member', async () => {
    const newTeamMember: TeamMemberDTO = {
      member: {
        accountTier: AccountTier.Basic,
        logBookSharing: LogBookSharing.FriendsOnly,
        memberSince: Date.now(),
        userId: '93603c13-140c-400f-b8a5-bfff41e84f26',
        username: 'user-mcuserface',
      },
      title: 'Owner',
      joined: '2011-01-12',
    };
    const saveSpy = jest
      .spyOn(client.operators, 'addOrUpdateTeamMember')
      .mockResolvedValue(newTeamMember);
    const wrapper = mount(EditTeamMembers, opts);
    await flushPromises();

    await wrapper.get(AddTeamMemberButton).trigger('click');
    await wrapper
      .getComponent(SearchProfiles)
      .vm.$emit('select-profiles', [newTeamMember.member]);
    await wrapper.getComponent(EditTeamMember).vm.$emit('save', newTeamMember);
    await flushPromises();

    expect(saveSpy).toHaveBeenCalledWith(
      PartialOperator.slug,
      newTeamMember.member.username,
      newTeamMember,
    );

    const newItem = wrapper.findComponent(TeamMemberListItem);
    expect(newItem.props('teamMember')).toEqual(newTeamMember);
  });

  it('will allow a user to update an existing member', async () => {
    const newTitle = 'Master of Diving';
    const newJoined = '2022-08-09';
    const expected = {
      ...TeamMembers.data[0],
      title: newTitle,
      joined: newJoined,
    };
    const saveSpy = jest
      .spyOn(client.operators, 'addOrUpdateTeamMember')
      .mockResolvedValue(expected);
    const wrapper = mount(EditTeamMembers, opts);
    await flushPromises();

    const item = wrapper.getComponent(TeamMemberListItem);
    await item
      .get(`[data-testid="btn-edit-team-member-${expected.member.username}"]`)
      .trigger('click');
    wrapper.getComponent(EditTeamMember).vm.$emit('save', expected);
    await flushPromises();

    expect(saveSpy).toHaveBeenCalledWith(
      PartialOperator.slug,
      TeamMembers.data[0].member.username,
      expected,
    );
    expect(item.props('teamMember')).toEqual(expected);
  });
});
