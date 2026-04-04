'use strict';

/**
 * Liquid Network service — Phase 1 prototype.
 *
 * The "Liquid integration" in Phase 1 is intentionally simulated:
 *   - We store data that mirrors what would live on Liquid (asset_id, transfers).
 *   - The Blockstream public testnet REST API is used for balance/address queries
 *     where possible, but asset issuance requires a full Liquid node (GDK).
 *   - Every function that would hit the real Liquid network is clearly marked
 *     and structured so a real GDK implementation can be dropped in for Phase 2.
 *
 * Real Liquid API: https://blockstream.info/liquidtestnet/api
 */

const { v4: uuidv4 } = require('uuid');

const LIQUID_API = process.env.LIQUID_API_URL || 'https://blockstream.info/liquidtestnet/api';

/**
 * Generate a simulated Liquid asset ID for a harvest lot.
 * Format mirrors real Liquid asset IDs (64-char hex).
 *
 * In production: call GDK's `create_transaction` + `issue_asset`.
 */
function generateAssetId(lotId) {
  // Use the lot UUID to derive a deterministic-looking hex string.
  const hex = lotId.replace(/-/g, '') + uuidv4().replace(/-/g, '');
  return hex.slice(0, 64);
}

/**
 * "Issue" a Liquid asset for a harvest lot.
 * Returns an object mirroring what the Liquid GDK would return.
 *
 * In production: sign + broadcast an asset issuance transaction.
 */
async function issueAsset({ lotId, farmId, metadata }) {
  const assetId = generateAssetId(lotId);

  // In production this would be the txid of the issuance transaction.
  const issuanceTxId = 'sim_' + uuidv4().replace(/-/g, '').slice(0, 60);

  return {
    asset_id: assetId,
    issuance_tx: issuanceTxId,
    contract: {
      entity: { domain: 'chainbytes.io' },
      issuer_pubkey: 'sim_pubkey_' + farmId.slice(0, 8),
      name: `Chainbytes Lot ${lotId.slice(0, 8)}`,
      precision: 0,
      ticker: 'CBLOT',
      version: 0,
    },
    metadata,
    simulated: true,
    note: 'Phase 1 prototype — swap in GDK for Phase 2',
  };
}

/**
 * "Transfer" a Liquid asset from one party to another.
 * Returns a simulated transaction record.
 *
 * In production: construct + sign a Liquid transaction spending the asset UTXO.
 */
async function transferAsset({ assetId, fromAddress, toAddress, metadata }) {
  const txId = 'sim_tx_' + uuidv4().replace(/-/g, '').slice(0, 57);

  return {
    tx_id: txId,
    asset_id: assetId,
    from: fromAddress,
    to: toAddress,
    metadata,
    confirmed: false,
    simulated: true,
    note: 'Phase 1 prototype — swap in GDK for Phase 2',
  };
}

/**
 * Query the Blockstream Liquid testnet API for address info.
 * This IS a real network call — used to demonstrate real API integration.
 */
async function queryAddress(address) {
  const url = `${LIQUID_API}/address/${address}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Record a shift's attendance batch as a simulated Liquid asset.
 * In production: issue an asset with the worker list embedded in the contract.
 */
async function recordShiftOnLiquid({ shiftId, farmId, workerAddresses, timestamp }) {
  const assetId = 'liq_shift_' + shiftId.replace(/-/g, '').slice(0, 22);
  return {
    asset_id: assetId,
    shift_id: shiftId,
    worker_count: workerAddresses.length,
    timestamp,
    simulated: true,
  };
}

module.exports = {
  issueAsset,
  transferAsset,
  queryAddress,
  recordShiftOnLiquid,
  generateAssetId,
  LIQUID_API,
};
