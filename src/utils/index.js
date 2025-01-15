export function formatLastSeen(lastSeen) {
  const now = new Date();
  const lastSeenDate = new Date(lastSeen);

  // Check if lastSeen is from today
  const isToday = lastSeenDate.toDateString() === now.toDateString();

  // Check if lastSeen is from yesterday
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = lastSeenDate.toDateString() === yesterday.toDateString();

  if (isToday) {
    // Return time in 12-hour format with AM/PM
    return lastSeenDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (isYesterday) {
    return 'Yesterday';
  } else {
    // Return date in DD/MM/YYYY format
    const day = String(lastSeenDate.getDate()).padStart(2, '0');
    const month = String(lastSeenDate.getMonth() + 1).padStart(2, '0');
    const year = lastSeenDate.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
