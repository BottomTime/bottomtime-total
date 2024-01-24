import { CurrentUserDTO, UserRole } from '@bottomtime/api';

export type NavLink = {
  title: string;
  url: string;
};

export function getNavLinks(currentUser: CurrentUserDTO) {
  const navLinks: NavLink[] = [
    {
      title: 'Home',
      url: '/',
    },
    {
      title: 'About',
      url: '/about',
    },
    {
      title: 'Contact',
      url: '/contact',
    },
  ];

  if (!currentUser.anonymous && currentUser.role === UserRole.Admin) {
    navLinks.push({
      title: 'Admin',
      url: '/admin',
    });
  }

  return navLinks;
}
