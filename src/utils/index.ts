import { format, subDays } from 'date-fns';
export function getDate(sub: number = 0) {
  const dateXDaysAgo: Date = subDays(new Date(), sub);

  return format(dateXDaysAgo, 'dd/MM/yyyy');
}
