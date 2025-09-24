import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import UserRoleManagement from "../components/UserRoleManagement";

export default function UserRoleManagementPage() {
  return (
    <MasterLayout>
      <Breadcrumb title="User Role Management" />
      <UserRoleManagement />
    </MasterLayout>
  );
}

