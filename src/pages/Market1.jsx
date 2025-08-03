import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import CompMarket1 from "../components/CompMarket1";

const Market1 = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Listings' />

        {/* DashBoardLayerSeven */}
        <CompMarket1 />
      </MasterLayout>
    </>
  );
};

export default Market1;
