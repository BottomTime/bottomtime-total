import { RouteRecordRaw } from 'vue-router';

export const UserRoutes: RouteRecordRaw[] = [
  {
    path: '/account',
    name: 'account',
    component: () => import('../views/account-view.vue'),
  },
  {
    path: '/account/checkout',
    name: 'account-checkout',
    component: () => import('../views/checkout-view.vue'),
  },
  {
    path: '/friends',
    name: 'friends',
    component: () => import('../views/friends-view.vue'),
  },
  {
    path: '/friendRequests',
    name: 'friend-requests',
    component: () => import('../views/friend-requests-view.vue'),
  },
  {
    path: '/membership/canceled',
    name: 'membership-canceled',
    component: () => import('../views/membership-canceled-view.vue'),
  },
  {
    path: '/membership/confirmation',
    name: 'membership-confirmation',
    component: () => import('../views/membership-confirmation-view.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/profile-view.vue'),
  },
  {
    path: '/profile/:username',
    name: 'named-profile',
    component: () => import('../views/profile-view.vue'),
  },
  {
    path: '/profile/:username/tanks',
    name: 'profile-tanks',
    component: () => import('../views/profile-tanks-view.vue'),
  },
  {
    path: '/profile/:username/tanks/new',
    name: 'profile-new-tank',
    component: () => import('../views/profile-new-tank-view.vue'),
  },
  {
    path: '/profile/:username/tanks/:tankId',
    name: 'profile-tank',
    component: () => import('../views/profile-tank-view.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/register-view.vue'),
  },
  {
    path: '/resetPassword',
    name: 'reset-password',
    component: () => import('../views/reset-password-view.vue'),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/settings-view.vue'),
  },
  {
    path: '/verifyEmail',
    name: 'verify-email',
    component: () => import('../views/verify-email-view.vue'),
  },
  {
    path: '/welcome',
    name: 'welcome',
    component: () => import('../views/welcome-view.vue'),
  },
];
