import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import DashBoardLayerSeven from "../components/DashBoardLayerSeven";


const Dashboard = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Vendor' />

        {/* DashBoardLayerSeven */}
        <DashBoardLayerSeven />
      </MasterLayout>
    </>
  );
};

export default Dashboard;
