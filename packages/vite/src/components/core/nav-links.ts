import { UserRole } from '@bottomtime/api';
import { User } from '../../client/user';

export type NavLink = {
  title: string;
  url: string;
};

export function getNavLinks(currentUser: User | null) {
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

  if (currentUser?.role === UserRole.Admin) {
    navLinks.push({
      title: 'Admin',
      url: '/admin',
    });
  }

  return navLinks;
}
