import { UserDTO, UserRole } from '@bottomtime/api';

export type NavLink = {
  title: string;
  url: string;
};

export function getNavLinks(currentUser: UserDTO | null) {
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
      url: '/admin/users',
    });
  }

  return navLinks;
}
