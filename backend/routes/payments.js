
import express from 'express';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const router = express.Router();
const db = getFirestore();

// Helper: Audit log
async function logAudit(userId, action, details) {
	await db.collection('auditLogs').add({
		userId,
		action,
		details,
		timestamp: new Date().toISOString(),
	});
}

// GET sponsored groups for user
router.get('/sponsored-groups', async (req, res) => {
	try {
		const groupsSnap = await db.collection('sponsoredGroups').get();
		const groups = groupsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
		res.json({ groups });
	} catch (err) {
		res.status(500).json({ error: 'Failed to fetch sponsored groups' });
	}
});

// POST redeem voucher
router.post('/redeem-voucher', async (req, res) => {
	const { userId, code } = req.body;
	if (!userId || !code) return res.status(400).json({ error: 'Missing userId or code' });
	try {
		const voucherRef = db.collection('vouchers').doc(code);
		const voucherDoc = await voucherRef.get();
		if (!voucherDoc.exists || voucherDoc.data().redeemed) {
			return res.status(400).json({ error: 'Invalid or already redeemed voucher' });
		}
		await voucherRef.update({ redeemed: true, redeemedBy: userId, redeemedAt: new Date().toISOString() });
		const userRef = db.collection('users').doc(userId);
		await userRef.update({ credits: FieldValue.increment(10) });
		await logAudit(userId, 'redeem-voucher', { code });
		res.json({ message: 'Voucher redeemed! 10 Kumii Credits added.' });
	} catch (err) {
		res.status(500).json({ error: 'Voucher redemption failed' });
	}
});

// POST pay with credits
router.post('/pay-with-credits', async (req, res) => {
	const { userId } = req.body;
	if (!userId) return res.status(400).json({ error: 'Missing userId' });
	try {
		const userRef = db.collection('users').doc(userId);
		const userDoc = await userRef.get();
		if (!userDoc.exists || (userDoc.data().credits || 0) < 1) {
			return res.status(400).json({ error: 'Insufficient Kumii Credits' });
		}
		await userRef.update({ credits: FieldValue.increment(-1) });
		await db.collection('transactions').add({ userId, type: 'credit', amount: -1, timestamp: new Date().toISOString() });
		await logAudit(userId, 'pay-with-credits', {});
		res.json({ message: 'Payment successful! 1 Kumii Credit deducted.' });
	} catch (err) {
		res.status(500).json({ error: 'Credit payment failed' });
	}
});

// POST apply sponsorship
router.post('/apply-sponsorship', async (req, res) => {
	const { userId, groupId } = req.body;
	if (!userId || !groupId) return res.status(400).json({ error: 'Missing userId or groupId' });
	try {
		const userRef = db.collection('users').doc(userId);
		const userDoc = await userRef.get();
		if (!userDoc.exists || !(userDoc.data().groups || []).includes(groupId)) {
			return res.status(403).json({ error: 'Not eligible for this sponsorship' });
		}
		await db.collection('transactions').add({ userId, type: 'sponsorship', groupId, timestamp: new Date().toISOString() });
		await logAudit(userId, 'apply-sponsorship', { groupId });
		res.json({ message: 'Sponsorship applied! Session booked for free.' });
	} catch (err) {
		res.status(500).json({ error: 'Sponsorship application failed' });
	}
});

export default router;
