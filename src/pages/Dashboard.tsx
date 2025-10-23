import MasterLayout from "../masterLayout/MasterLayout";
import DashBoardLayerSeven from "../components/DashBoardLayerSeven";
import { useQuery } from "@tanstack/react-query";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const Dashboard = () => (
  <MasterLayout>
    <DashBoardLayerSeven />
  </MasterLayout>
);

// Example: Fetch dashboard stats from Firestore
const { data: stats = {}, isLoading } = useQuery({
  queryKey: ["dashboardStats"],
  queryFn: async () => {
    const db = getFirestore();
    const snapshot = await getDocs(collection(db, "dashboardStats"));
    // Transform Firestore docs to object keyed by stat name
    const result: Record<string, any> = {};
    snapshot.docs.forEach(doc => {
      result[doc.id] = doc.data();
    });
    return result;
  },
  staleTime: 1000 * 60,
});

export default Dashboard;
// Add loading and stats display logic here
// ...
