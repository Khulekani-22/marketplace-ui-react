import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import MessagingSystem from "../components/MessagingSystem";

const EmailPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Message Center' />

        {/* MessagingSystem */}
        <MessagingSystem />
      </MasterLayout>
    </>
  );
};

export default EmailPage;
