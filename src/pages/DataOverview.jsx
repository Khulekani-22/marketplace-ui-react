import React from 'react';
import { getAppData } from '../utils/loadData';

const {
  bookings,
  cohorts,
  events,
  forumThreads,
  jobs,
  mentorshipSessions,
  messageThreads,
  services,
  startups
} = getAppData();

const DataOverview = () => {
  return (
    <div className="container py-5">
      <h2 className="mb-4">App Data Overview</h2>
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">

        <div className="col">
          <div className="card shadow-sm border-primary">
            <div className="card-body">
              <h5 className="card-title">Bookings</h5>
              <p className="card-text">{bookings.length} total bookings</p>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card shadow-sm border-secondary">
            <div className="card-body">
              <h5 className="card-title">Cohorts</h5>
              <p className="card-text">{cohorts.length} cohorts available</p>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card shadow-sm border-success">
            <div className="card-body">
              <h5 className="card-title">Events</h5>
              <p className="card-text">{events.length} upcoming events</p>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card shadow-sm border-warning">
            <div className="card-body">
              <h5 className="card-title">Forum Threads</h5>
              <p className="card-text">{forumThreads.length} discussions</p>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card shadow-sm border-danger">
            <div className="card-body">
              <h5 className="card-title">Jobs</h5>
              <p className="card-text">{jobs.length} job postings</p>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card shadow-sm border-info">
            <div className="card-body">
              <h5 className="card-title">Mentorship Sessions</h5>
              <p className="card-text">{mentorshipSessions.length} scheduled</p>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card shadow-sm border-dark">
            <div className="card-body">
              <h5 className="card-title">Messages</h5>
              <p className="card-text">{messageThreads.length} message threads</p>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card shadow-sm border-primary">
            <div className="card-body">
              <h5 className="card-title">Services</h5>
              <p className="card-text">{services.length} services listed</p>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card shadow-sm border-secondary">
            <div className="card-body">
              <h5 className="card-title">Startups</h5>
              <p className="card-text">{startups.length} startup profiles</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DataOverview;
