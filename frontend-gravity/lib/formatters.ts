export function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return parts[0][0];
}

export function shortName(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1][0]}.`;
  }
  return name;
}

export function getSubjectBgColor(subject: string): string {
  switch (subject) {
    case 'Математика':
      return 'bg-purple-3 dark:bg-purple-1/20';
    case 'Английский':
      return 'bg-green-2 dark:bg-green-1/20';
    case 'Физика':
      return 'bg-yellow-2 dark:bg-yellow-1/20';
    default:
      return 'bg-n-4/50 dark:bg-white/10';
  }
}
