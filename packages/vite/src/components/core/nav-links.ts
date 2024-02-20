import { UserDTO, UserRole } from '@bottomtime/api';

export function getNavLinks(currentUser: UserDTO | null): NavLink[] {
  const navLinks: NavLink[] = [
    {
      title: 'Home',
      url: '/',
      visible: true,
    },
    {
      title: 'Dive Sites',
      url: '/diveSites',
      visible: true,
    },
    {
      title: 'Admin',
      url: '/admin/users',
      visible: currentUser?.role === UserRole.Admin,
    },
  ];

  return navLinks;
}
