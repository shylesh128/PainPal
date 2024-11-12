// utils/localizeTime.js
export function localizeTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();

  const options = { hour: "numeric", minute: "numeric", hour12: true };
  const timeString = date.toLocaleTimeString([], options);

  const isToday = now.toDateString() === date.toDateString();
  if (isToday) {
    return `Today, ${timeString}`;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = yesterday.toDateString() === date.toDateString();

  if (isYesterday) {
    return `Yesterday, ${timeString}`;
  }

  // If the date is neither today nor yesterday, show the full date
  const dateOptions = { year: "numeric", month: "short", day: "numeric" };
  const dateString = date.toLocaleDateString([], dateOptions);
  return `${dateString}, ${timeString}`;
}
