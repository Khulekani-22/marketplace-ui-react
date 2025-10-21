import express from "express";
import { getFirestore } from "firebase-admin/firestore";

const router = express.Router();
const db = getFirestore();

// PATCH/POST meeting link for a booking
router.post("/:bookingId/meeting-link", async (req, res) => {
  const { bookingId } = req.params;
  const { link } = req.body;
  if (!bookingId || !link) {
    return res.status(400).json({ error: "Missing bookingId or link" });
  }
  try {
    const bookingRef = db.collection("bookings").doc(bookingId);
    await bookingRef.update({ meetingLink: link });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update meeting link", details: err.message });
  }
});

export default router;
