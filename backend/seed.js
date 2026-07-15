/**
 * Sample data seed script.
 *
 * Usage:
 *   cd backend
 *   node seed.js            — adds sample data (skips if data already exists)
 *   node seed.js --reset    — WARNING: deletes all existing users & requests first, then seeds fresh
 *
 * This connects using the same MONGO_URI from your .env file — it seeds
 * whichever database you're already pointed at, local or Atlas.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const BloodRequest = require('./src/models/BloodRequest');

const SAMPLE_USERS = [
  {
    name: 'Admin User',
    email: 'admin@blooddonor.test',
    password: 'Admin@123',
    role: 'admin',
    phone: '9000000001',
    bloodGroup: 'O+',
    location: { city: 'Erode', state: 'Tamil Nadu' },
  },
  {
    name: 'Arun Kumar',
    email: 'arun.donor@blooddonor.test',
    password: 'Passw0rd1',
    role: 'donor',
    phone: '9000000002',
    bloodGroup: 'O+',
    location: { city: 'Erode', state: 'Tamil Nadu' },
    isAvailable: true,
  },
  {
    name: 'Priya Raman',
    email: 'priya.donor@blooddonor.test',
    password: 'Passw0rd1',
    role: 'donor',
    phone: '9000000003',
    bloodGroup: 'A+',
    location: { city: 'Coimbatore', state: 'Tamil Nadu' },
    isAvailable: true,
  },
  {
    name: 'Karthik Subramaniam',
    email: 'karthik.donor@blooddonor.test',
    password: 'Passw0rd1',
    role: 'donor',
    phone: '9000000004',
    bloodGroup: 'B+',
    location: { city: 'Chennai', state: 'Tamil Nadu' },
    isAvailable: false, // deliberately unavailable — useful for testing search filters
  },
  {
    name: 'Divya Shankar',
    email: 'divya.donor@blooddonor.test',
    password: 'Passw0rd1',
    role: 'donor',
    phone: '9000000005',
    bloodGroup: 'O-',
    location: { city: 'Salem', state: 'Tamil Nadu' },
    isAvailable: true,
  },
  {
    name: 'Meena Iyer',
    email: 'meena.seeker@blooddonor.test',
    password: 'Passw0rd1',
    role: 'seeker',
    phone: '9000000006',
    bloodGroup: 'O+', // even seekers need a blood group on file in this schema
    location: { city: 'Erode', state: 'Tamil Nadu' },
  },
];

async function seed() {
  const shouldReset = process.argv.includes('--reset');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB:', mongoose.connection.host);

  if (shouldReset) {
    await User.deleteMany({ email: { $regex: '@blooddonor\\.test$' } });
    await BloodRequest.deleteMany({});
    console.log('🗑️  Cleared previous sample users and all blood requests');
  }

  const createdUsers = {};
  for (const userData of SAMPLE_USERS) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      console.log(`↷  Skipped (already exists): ${userData.email}`);
      createdUsers[userData.email] = existing;
      continue;
    }
    const user = await User.create(userData); // pre-save hook hashes the password automatically
    createdUsers[userData.email] = user;
    console.log(`✅ Created user: ${userData.email} (${userData.role})`);
  }

  const sampleRequests = [
    {
      requester: createdUsers['meena.seeker@blooddonor.test']._id,
      patientName: 'Ramesh Kumar',
      bloodGroup: 'O+',
      unitsNeeded: 2,
      hospital: { name: 'Government Hospital', city: 'Erode', state: 'Tamil Nadu' },
      urgency: 'urgent',
      notes: 'Needed for scheduled surgery',
      status: 'pending',
    },
    {
      requester: createdUsers['meena.seeker@blooddonor.test']._id,
      patientName: 'Lakshmi Devi',
      bloodGroup: 'A+',
      unitsNeeded: 1,
      hospital: { name: 'KMCH', city: 'Coimbatore', state: 'Tamil Nadu' },
      urgency: 'critical',
      status: 'accepted',
      donor: createdUsers['priya.donor@blooddonor.test']._id,
      acceptedAt: new Date(),
    },
    {
      requester: createdUsers['arun.donor@blooddonor.test']._id, // donors can request too
      patientName: 'Suresh Babu',
      bloodGroup: 'O-',
      unitsNeeded: 3,
      hospital: { name: 'Apollo Hospital', city: 'Salem', state: 'Tamil Nadu' },
      urgency: 'normal',
      status: 'fulfilled',
      donor: createdUsers['divya.donor@blooddonor.test']._id,
      acceptedAt: new Date(Date.now() - 2 * 86400000),
      fulfilledAt: new Date(),
    },
  ];

  for (const reqData of sampleRequests) {
    const exists = await BloodRequest.findOne({
      patientName: reqData.patientName,
      requester: reqData.requester,
    });
    if (exists) {
      console.log(`↷  Skipped (already exists): request for ${reqData.patientName}`);
      continue;
    }
    await BloodRequest.create(reqData);
    console.log(`✅ Created blood request for: ${reqData.patientName} (${reqData.status})`);
  }

  console.log('\n--- Sample login credentials ---');
  console.log('Admin:   admin@blooddonor.test / Admin@123');
  console.log('Donor:   arun.donor@blooddonor.test / Passw0rd1');
  console.log('Seeker:  meena.seeker@blooddonor.test / Passw0rd1');
  console.log('(see SAMPLE_DATA.md for the full list)');

  await mongoose.disconnect();
  console.log('\n✅ Seeding complete.');
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err.message);
  process.exit(1);
});
