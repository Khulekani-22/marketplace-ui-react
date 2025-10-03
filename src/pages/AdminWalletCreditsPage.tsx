// src/pages/AdminWalletCreditsPage.tsx
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import AdminWalletCreditsLayer from "../components/AdminWalletCreditsLayer";

const AdminWalletCreditsPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title="Wallet Credits Management" />
      <AdminWalletCreditsLayer />
    </MasterLayout>
  );
};

export default AdminWalletCreditsPage;
