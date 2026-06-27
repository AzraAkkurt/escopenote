import { NavLink } from 'react-router-dom';

interface NavItemProps {
  to: string;
  label: string;
  end?: boolean;
}

export function NavItem({ to, label, end }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `nav-item${isActive ? ' nav-item--active' : ''}`}
    >
      {label}
    </NavLink>
  );
}
