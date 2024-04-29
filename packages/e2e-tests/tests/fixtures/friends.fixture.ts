import { Page } from '@playwright/test';

export class FriendsFixture {
  constructor(private readonly page: Page) {}

  async gotoFriends(): Promise<void> {
    await this.page.goto('/friends');
  }

  async gotoFriendRequests(): Promise<void> {
    await this.page.goto('/friendRequests');
  }

  async addFriend(query: string, username: string): Promise<void> {
    await this.page.getByTestId('add-friend').click();
    await this.page.getByTestId('search-users').fill(query);
    await this.page.getByTestId('search-users').press('Enter');
    await this.page.getByTestId(`send-request-${username}`).click();
  }
}
