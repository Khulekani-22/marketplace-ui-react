import { useQuery } from "@tanstack/react-query";
import { getFirestore, collection, getDocs } from "firebase/firestore";
// src/pages/AdminWalletCreditsPage.tsx
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import AdminWalletCreditsLayer from "../components/AdminWalletCreditsLayer";

const AdminWalletCreditsPage = () => {
  // Fetch wallet credits from Firestore with React Query
  const { data: credits = [], isLoading } = useQuery({
    queryKey: ["adminWalletCredits"],
    queryFn: async () => {
      const db = getFirestore();
      const snapshot = await getDocs(collection(db, "adminWalletCredits"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    staleTime: 1000 * 60,
  });

  return (
    <MasterLayout>
      <Breadcrumb title="Wallet Credits Management" />
      <AdminWalletCreditsLayer />
      <div className="container py-4">
        <h2 className="h5 mb-3">Wallet Credits</h2>
        {isLoading ? (
          <div>Loading wallet credits…</div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {credits.map((c: any) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.user || c.email || "—"}</td>
                    <td>{c.amount}</td>
                    <td>{c.date || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MasterLayout>
  );
};

export default AdminWalletCreditsPage;
