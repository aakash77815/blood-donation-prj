# Sample Data for Testing

Run this once your backend is connected to MongoDB Atlas:

```bash
cd backend
node seed.js
```

This inserts sample donors, a seeker, an admin, and blood requests in different statuses — so you have realistic data to demo immediately, without registering a dozen accounts by hand.

Safe to run more than once — it skips anything that already exists. To wipe and reseed from scratch instead:
```bash
node seed.js --reset
```
**Warning:** `--reset` deletes all sample users (matching `@blooddonor.test` emails) and **all** blood requests in your database. Don't run it against a database with real data you care about.

## Sample Login Credentials

| Role | Email | Password | Blood Group | City |
|---|---|---|---|---|
| Admin | `admin@blooddonor.test` | `Admin@123` | O+ | Erode |
| Donor | `arun.donor@blooddonor.test` | `Passw0rd1` | O+ | Erode |
| Donor | `priya.donor@blooddonor.test` | `Passw0rd1` | A+ | Coimbatore |
| Donor (unavailable) | `karthik.donor@blooddonor.test` | `Passw0rd1` | B+ | Chennai |
| Donor | `divya.donor@blooddonor.test` | `Passw0rd1` | O- | Salem |
| Seeker | `meena.seeker@blooddonor.test` | `Passw0rd1` | O+ | Erode |

Karthik is deliberately marked unavailable (`isAvailable: false`) — useful for confirming your donor search correctly excludes unavailable donors by default.

## Sample Blood Requests Created

| Patient | Blood Group | Status | Notes |
|---|---|---|---|
| Ramesh Kumar | O+ | `pending` | Open — try accepting this as `arun.donor` (also O+) |
| Lakshmi Devi | A+ | `accepted` | Already assigned to `priya.donor` — try marking it fulfilled |
| Suresh Babu | O- | `fulfilled` | Complete lifecycle example — try confirming it can't be cancelled |

## Quick demo flow using this data
1. Log in as `admin@blooddonor.test` → visit `/admin` to see the dashboard already populated with real numbers, and `/admin/requests` to see all three requests.
2. Log in as `meena.seeker@blooddonor.test` → visit `/requests` to see the "Ramesh Kumar" request still pending.
3. Log in as `arun.donor@blooddonor.test` → visit `/requests`, find the pending O+ request, click **Accept**.
4. Switch back to `meena.seeker@blooddonor.test` → refresh `/requests` → see the status has changed to `accepted`, with Arun's contact info now shown.
