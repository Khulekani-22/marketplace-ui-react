const express = require("express");
const fs = require("fs");
const router = express.Router();

const DATA_PATH = __dirname + "/../appData.json";

function readData() {
  return JSON.parse(fs.readFileSync(DATA_PATH));
}

function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// READ all
router.get("/", (req, res) => {
  const data = readData();
  res.json(data);
});

// CREATE a new service
router.post("/services", (req, res) => {
  const data = readData();
  const newService = req.body;
  data.services.push(newService);
  writeData(data);
  res.status(201).json(newService);
});

// UPDATE a service
router.put("/services/:id", (req, res) => {
  const data = readData();
  const index = data.services.findIndex((s) => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Service not found" });

  data.services[index] = { ...data.services[index], ...req.body };
  writeData(data);
  res.json(data.services[index]);
});

// DELETE a service
router.delete("/services/:id", (req, res) => {
  const data = readData();
  const index = data.services.findIndex((s) => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Service not found" });

  const removed = data.services.splice(index, 1);
  writeData(data);
  res.json(removed[0]);
});

module.exports = router;
