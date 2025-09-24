import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import AuditLogsLayer from "../components/AuditLogsLayer";

const AuditLogsPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title="Audit Logs" />
      <AuditLogsLayer />
    </MasterLayout>
  );
};

export default AuditLogsPage;

