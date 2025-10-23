import MasterLayout from "../masterLayout/MasterLayout";
import DashBoardLayerSeven from "../components/DashBoardLayerSeven";
import { useQuery } from "@tanstack/react-query";
import { getFirestore, collection, getDocs } from "firebase/firestore";


const Dashboard = () => {
  const { data: stats = {}, isLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const db = getFirestore();
      const snapshot = await getDocs(collection(db, "dashboardStats"));
      const result: Record<string, any> = {};
      snapshot.docs.forEach(doc => {
        result[doc.id] = doc.data();
      });
      return result;
    },
    staleTime: 1000 * 60,
  });

  return (
    <MasterLayout>
      <DashBoardLayerSeven />
      <div style={{ marginTop: 24 }}>
        <h2>Dashboard Stats</h2>
        {isLoading ? (
          <p>Loading stats...</p>
        ) : (
          <pre>{JSON.stringify(stats, null, 2)}</pre>
        )}
      </div>
    </MasterLayout>
  );
};

export default Dashboard;
