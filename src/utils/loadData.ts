import data from '../data/appData.json';

export const getAppData = () => {
  const { bookings, cohorts, events, forumThreads, jobs, mentorshipSessions, messageThreads, services, startups } = data;

  // You can destructure or export as-is depending on usage
  return {
    bookings,
    cohorts,
    events,
    forumThreads,
    jobs,
    mentorshipSessions,
    messageThreads,
    services,
    startups
  };
};
