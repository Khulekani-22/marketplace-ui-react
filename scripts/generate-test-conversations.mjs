#!/usr/bin/env node
// Script to generate test conversations between admin and vendor users using the messaging API
import fetch from 'node-fetch';
import { readFile } from 'fs/promises';

const serviceAccount = JSON.parse(await readFile('./serviceAccountKey.json', 'utf8'));
const apiBase = 'http://localhost:3000/api/messages';

// Example admin and vendor users
const adminUsers = [
  { email: 'khulekani@22onsloane.co', name: 'Khulekani Magubane' },
  { email: '22onsloanedigitalteam@gmail.com', name: 'Sloane Digital Team' }
];
const vendorUsers = [
  { email: 'mncubekhulekani@gmail.com', name: 'Mncube Khulekani' },
  { email: 'ruthmaphosa2024@gmail.com', name: 'Ruth Maphosa' },
  { email: 'zinhlesloane@gmail.com', name: 'Zinhle Sloane' },
  { email: 'khulekani@gecafrica.co', name: 'Khulekani Magubane' }
];

const testMessages = [
  'Hello Vendor, this is a test message from Admin.',
  'Welcome to the marketplace! Please let us know if you need any help.',
  'This is a test conversation for system validation.'
];

async function sendTestMessage(from, to, content) {
  const body = {
    to: to.email,
    subject: `Test Conversation: ${from.name} to ${to.name}`,
    content,
    priority: 'normal'
  };
  const res = await fetch(apiBase, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    console.error(`Failed to send message from ${from.email} to ${to.email}:`, await res.text());
  } else {
    console.log(`✅ Sent test message from ${from.email} to ${to.email}`);
  }
}

async function main() {
  for (const admin of adminUsers) {
    for (const vendor of vendorUsers) {
      for (const msg of testMessages) {
        await sendTestMessage(admin, vendor, msg);
      }
    }
  }
}

main();
