const Icon = ({
  children,
  size = 20
}) => <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>;
const UserIcon = () => <Icon>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
  </Icon>;
const PlaneIcon = () => <Icon>
    <path d="M10.5 13.5 3 11l1.5-1.5 9 .5 4.5-4.5a1.8 1.8 0 0 1 2.6 2.6L15.1 12.6l.5 9L14 22.9l-2.5-7.4" />
  </Icon>;
const BookingIcon = () => <Icon>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4.5h6M9 11h6M9 15h4" />
  </Icon>;
const LockIcon = () => <Icon>
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </Icon>;
const EditIcon = () => <Icon size={18}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
  </Icon>;
const MailIcon = () => <Icon size={18}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Icon>;
const PhoneIcon = () => <Icon size={18}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
  </Icon>;
const CalendarIcon = () => <Icon size={18}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" />
  </Icon>;
export { Icon, UserIcon, PlaneIcon, BookingIcon, LockIcon, EditIcon, MailIcon, PhoneIcon, CalendarIcon };
