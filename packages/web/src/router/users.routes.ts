import { RouteRecordRaw } from 'vue-router';

export const UserRouteNames = {
  Account: 'account',
  AccountCheckout: 'account-checkout',
  Friends: 'friends',
  FriendRequests: 'friend-requests',
  MembershipCanceled: 'membership-canceled',
  MembershipConfirmation: 'membership-confirmation',
  Profile: 'profile',
  NamedProfile: 'named-profile',
  ProfileTanks: 'profile-tanks',
  ProfileNewTank: 'profile-new-tank',
  ProfileTank: 'profile-tank',
  Register: 'register',
  ResetPassword: 'reset-password',
  Settings: 'settings',
  VerifyEmail: 'verify-email',
  Welcome: 'welcome',
} as const;

export const UserRoutes: RouteRecordRaw[] = [
  {
    path: '/account',
    name: UserRouteNames.Account,
    component: () => import('../views/users/account-view.vue'),
  },
  {
    path: '/friends',
    name: UserRouteNames.Friends,
    component: () => import('../views/users/friends-view.vue'),
  },
  {
    path: '/friendRequests',
    name: UserRouteNames.FriendRequests,
    component: () => import('../views/users/friend-requests-view.vue'),
  },
  {
    path: '/membership/canceled',
    name: UserRouteNames.MembershipCanceled,
    component: () => import('../views/users/membership-canceled-view.vue'),
  },
  {
    path: '/membership/confirmation',
    name: UserRouteNames.MembershipConfirmation,
    component: () => import('../views/users/membership-confirmation-view.vue'),
  },
  {
    path: '/profile',
    name: UserRouteNames.Profile,
    component: () => import('../views/users/profile-view.vue'),
  },
  {
    path: '/profile/:username',
    name: UserRouteNames.NamedProfile,
    component: () => import('../views/users/profile-view.vue'),
  },
  {
    path: '/profile/:username/tanks',
    name: UserRouteNames.ProfileTanks,
    component: () => import('../views/users/profile-tanks-view.vue'),
  },
  {
    path: '/profile/:username/tanks/new',
    name: UserRouteNames.ProfileNewTank,
    component: () => import('../views/users/profile-new-tank-view.vue'),
  },
  {
    path: '/profile/:username/tanks/:tankId',
    name: UserRouteNames.ProfileTank,
    component: () => import('../views/users/profile-tank-view.vue'),
  },
  {
    path: '/register',
    name: UserRouteNames.Register,
    component: () => import('../views/users/register-view.vue'),
  },
  {
    path: '/resetPassword',
    name: UserRouteNames.ResetPassword,
    component: () => import('../views/users/reset-password-view.vue'),
  },
  {
    path: '/settings',
    name: UserRouteNames.Settings,
    component: () => import('../views/users/settings-view.vue'),
  },
  {
    path: '/verifyEmail',
    name: UserRouteNames.VerifyEmail,
    component: () => import('../views/users/verify-email-view.vue'),
  },
  {
    path: '/welcome',
    name: UserRouteNames.Welcome,
    component: () => import('../views/users/welcome-view.vue'),
  },
];
