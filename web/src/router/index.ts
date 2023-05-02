import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import LoginView from '@/views/LoginView.vue';
import NotFoundView from '@/views/NotFoundView.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/signup',
    name: 'signup',
    component: () =>
      import(/* webpackChunkName: "signup" */ '../views/SignupView.vue'),
  },
  {
    path: '/resetPassword',
    name: 'resetPassword',
    component: () =>
      import(
        /* webpackChunkName: "resetPassword" */ '../views/ResetPasswordView.vue'
      ),
  },
  {
    path: '/newPassword',
    name: 'createNewPassword',
    component: () =>
      import(
        /* webpackChunkName: "createNewPassword" */ '../views/CreateNewPasswordView.vue'
      ),
  },
  {
    path: '/account',
    component: () =>
      import(/* webpackChunkName: "account" */ '../views/AccountView.vue'),
    children: [
      {
        path: '',
        name: 'accountMain',
        component: () =>
          import(
            /* webpackChunkName: "accountMain" */ '../components/account/AccountMain.vue'
          ),
      },
      {
        path: 'changePassword',
        name: 'accountChangePassword',
        component: () =>
          import(
            /* webpackChunkName: "changePassword" */ '../components/account/ChangePasswordForm.vue'
          ),
      },
      {
        path: 'settings',
        name: 'accountSettings',
        component: () =>
          import(
            /* webpackChunkName: "accountSettings" */ '../components/account/AccountSettings.vue'
          ),
      },
    ],
  },
  {
    path: '/profile',
    name: 'profile',
    component: () =>
      import(/* webpackChunkName: "profile" */ '../views/ProfileView.vue'),
  },
  {
    path: '/welcome',
    name: 'welcome',
    component: () =>
      import(/* webpackChunkName: "welcome" */ '../views/WelcomeView.vue'),
  },
  {
    path: '/users',
    name: 'manageUsers',
    component: () =>
      import(/* webpackChunkName: "manageUsers" */ '../views/UsersView.vue'),
  },
  {
    path: '/privacy',
    name: 'privacyPolicy',
    component: () =>
      import(
        /* webpackChunkName: "privacyPolicy" */ '../views/PrivacyPolicyView.vue'
      ),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
