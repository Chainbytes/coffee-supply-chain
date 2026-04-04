'use strict';

/**
 * BTC price routes.
 *
 * GET  /btc-price       — returns current BTC/USD price with timestamp
 * POST /usd-to-sats     — converts a USD amount to satoshis
 *
 * Price is cached for 60 seconds to avoid hammering CoinGecko.
 */

const { Router } = require('express');

const router = Router();

const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';

// ------------------------------------------------------------------ cache
let _cache = null; // { usd: number, fetchedAt: number }
const CACHE_TTL_MS = 60_000;

async function getBtcPrice() {
  const now = Date.now();
  if (_cache && now - _cache.fetchedAt < CACHE_TTL_MS) {
    return _cache;
  }

  const res = await fetch(COINGECKO_URL);
  if (!res.ok) {
    throw new Error(`CoinGecko request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const usd = data?.bitcoin?.usd;

  if (typeof usd !== 'number') {
    throw new Error('Unexpected CoinGecko response shape');
  }

  _cache = { usd, fetchedAt: now };
  return _cache;
}

// ------------------------------------------------------------------ routes

/**
 * GET /btc-price
 * Returns { usd: <number>, timestamp: <iso> }
 */
router.get('/btc-price', async (req, res) => {
  try {
    const { usd, fetchedAt } = await getBtcPrice();
    res.json({ usd, timestamp: new Date(fetchedAt).toISOString() });
  } catch (err) {
    res.status(502).json({ error: `Failed to fetch BTC price: ${err.message}` });
  }
});

/**
 * POST /usd-to-sats
 * Body: { usd: <number> }
 * Returns { sats: <number>, btc_price: <number> }
 */
router.post('/usd-to-sats', async (req, res) => {
  const { usd } = req.body;

  if (usd === undefined || usd === null) {
    return res.status(400).json({ error: 'usd is required' });
  }

  const usdAmount = Number(usd);
  if (!Number.isFinite(usdAmount) || usdAmount < 0) {
    return res.status(400).json({ error: 'usd must be a non-negative number' });
  }

  try {
    const { usd: btcPrice } = await getBtcPrice();
    // 1 BTC = 100_000_000 sats
    const sats = Math.round((usdAmount / btcPrice) * 100_000_000);
    res.json({ sats, btc_price: btcPrice });
  } catch (err) {
    res.status(502).json({ error: `Failed to fetch BTC price: ${err.message}` });
  }
});

// Exposed for testing
router.clearCache = () => { _cache = null; };

module.exports = router;
