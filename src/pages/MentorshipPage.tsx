import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import MentorshipLayer from "../components/MentorshipLayer";

export default function MentorshipPage() {
  return (
    <MasterLayout>
      <Breadcrumb title="Mentorship" />
      <div className="mb-4">
        <h2 className="fw-semibold">Mentorship marketplace</h2>
        <p className="text-muted mb-0">
          Discover vetted mentors and book one-on-one sessions tailored to your startup journey.
        </p>
      </div>
      <MentorshipLayer />
    </MasterLayout>
  );
}
