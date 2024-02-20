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
      title: 'Dive Sites',
      url: '/diveSites',
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
