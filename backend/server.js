const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const appDataRoutes = require("./routes/appDataRoutes");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());
app.use("/api/data", appDataRoutes);

app.listen(PORT, () => {
  console.log(`✅ Backend API running at http://localhost:${PORT}`);
});
