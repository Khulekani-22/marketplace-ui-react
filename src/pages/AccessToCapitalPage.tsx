import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import AccessToCapitalLayer from "../components/AccessToCapitalLayer";

const AccessToCapitalPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title="Access to Capital" />
      <AccessToCapitalLayer />
    </MasterLayout>
  );
};

export default AccessToCapitalPage;
