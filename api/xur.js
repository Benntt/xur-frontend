// Runs on Vercel edge: https://<project>.vercel.app/api/xur
require('dotenv').config();
const fetch = require('node-fetch');

const API_KEY = process.env.BUNGIE_API_KEY; // set in Vercel dashboard
const VENDOR_HASH = '2190858386';           // Xûr

const LOCATION = [
  'Tower Hangar',
  'Tower Bazaar',
  'EDZ – Winding Cove',
  'Nessus – Watcher’s Grave',
  'Io – Giant’s Scar'
];

export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300'); // 5-min cache

  try {
    // 1) resolve a membership (✏️ change gamertag)
    const userRes = await fetch(
      `https://www.bungie.net/Platform/User/SearchUsers/?q=YOUR_BUNGIE_NAME_HERE`,
      { headers: { 'X-API-Key': API_KEY } }
    );
    const user = (await userRes.json()).Response[0];
    if (!user) throw new Error('Gamertag not found');
    const { membershipId, membershipType } = user.destinyMemberships[0];

    // 2) pick first character
    const profRes = await fetch(
      `https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/?components=100`,
      { headers: { 'X-API-Key': API_KEY } }
    );
    const characterId = (await profRes.json()).Response.profile.data.characterIds[0];

    // 3) Xûr inventory
    const xurRes = await fetch(
      `https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/Character/${characterId}/Vendors/${VENDOR_HASH}/?components=402,401`,
      { headers: { 'X-API-Key': API_KEY } }
    );
    const raw = await xurRes.json();
    if (raw.ErrorCode !== 1) throw new Error(raw.Message);

    const { sales, vendor } = raw.Response;
    const items = Object.values(sales.data).map(s => ({
      hash: s.itemHash,
      costs: s.costs.map(c => ({ hash: c.itemHash, qty: c.quantity }))
    }));

    res.json({
      location: LOCATION[vendor.vendorLocationIndex] || 'Unknown',
      reset: vendor.nextRefreshDate,
      items
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
