import { Page } from '@playwright/test';

export class FriendsFixture {
  constructor(private readonly page: Page) {}

  async gotoFriends(): Promise<void> {
    await this.page.goto('/friends');
    await this.page.waitForURL('**/friends');
  }

  async gotoFriendRequests(): Promise<void> {
    await this.page.goto('/friendRequests');
    await this.page.waitForURL('**/friendRequests');
  }

  async addFriend(query: string, username: string): Promise<void> {
    await this.page.getByTestId('add-friend').click();
    await this.page.getByTestId('search-users').fill(query);
    await this.page.getByTestId('search-users').press('Enter');
    await this.page.getByTestId(`send-request-${username}`).click();
  }

  async unfriend(username: string): Promise<void> {
    await this.page.getByTestId(`unfriend-${username}`).click();
    await this.page.getByTestId('dialog-confirm-button').click();
  }

  async acceptFriendRequest(userId: string): Promise<void> {
    await this.page.getByTestId(`accept-request-${userId}`).click();
    await this.page.getByTestId('dialog-confirm-button').click();
    await this.page.waitForSelector(
      '[data-testid="toast-friend-request-accepted"]',
    );
  }

  async declineFriendRequest(userId: string, reason?: string): Promise<void> {
    await this.page.getByTestId(`decline-request-${userId}`).click();
    if (reason) await this.page.getByTestId('decline-reason').fill(reason);
    await this.page.getByTestId('dialog-confirm-button').click();
    await this.page.waitForSelector(
      '[data-testid="toast-friend-request-declined"]',
    );
  }

  async openFriendProfile(username: string): Promise<void> {
    await this.page.getByTestId(`select-friend-${username}`).click();
    await this.page.getByTestId('drawer-fullscreen').click();
    await this.page.waitForURL(`**/profile/${username}`);
  }
}
