import { api } from '../lib/api';

export const getAppData = async () => {
  try {
    const { data } = await api.get('/api/lms/live', {
      headers: {
        "x-tenant-id": sessionStorage.getItem("tenantId") || "vendor",
        "cache-control": "no-cache",
      },
    });
    
    const { bookings, cohorts, events, forumThreads, jobs, mentorshipSessions, messageThreads, services, startups } = data || {};

    return {
      bookings: bookings || [],
      cohorts: cohorts || [],
      events: events || [],
      forumThreads: forumThreads || [],
      jobs: jobs || [],
      mentorshipSessions: mentorshipSessions || [],
      messageThreads: messageThreads || [],
      services: services || [],
      startups: startups || []
    };
  } catch (error) {
    console.error('Failed to load app data:', error);
    return {
      bookings: [],
      cohorts: [],
      events: [],
      forumThreads: [],
      jobs: [],
      mentorshipSessions: [],
      messageThreads: [],
      services: [],
      startups: []
    };
  }
};
