'use strict';

/**
 * Lightning Network service via LNbits REST API.
 *
 * LNbits docs: https://legend.lnbits.com/docs
 *
 * Set LNBITS_URL, LNBITS_ADMIN_KEY, and LNBITS_INVOICE_KEY in .env.
 * If keys are absent the service returns graceful mock responses so the
 * rest of the API still works in demo mode.
 */

const LNBITS_URL = (process.env.LNBITS_URL || 'https://legend.lnbits.com').replace(/\/$/, '');
const ADMIN_KEY = process.env.LNBITS_ADMIN_KEY || '';
const INVOICE_KEY = process.env.LNBITS_INVOICE_KEY || '';

const DEMO_MODE = !ADMIN_KEY || ADMIN_KEY === 'your_lnbits_admin_key_here';

/**
 * Create a Lightning invoice via LNbits.
 * Returns { payment_request, payment_hash, checking_id } on success.
 */
async function createInvoice({ amountSats, memo }) {
  if (DEMO_MODE) {
    return mockInvoice(amountSats, memo);
  }

  const res = await fetch(`${LNBITS_URL}/api/v1/payments`, {
    method: 'POST',
    headers: {
      'X-Api-Key': INVOICE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      out: false,
      amount: amountSats,
      memo: memo || 'Chainbytes worker payment',
      unit: 'sat',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LNbits invoice creation failed: ${res.status} — ${err}`);
  }

  return res.json();
}

/**
 * Pay a Lightning invoice via LNbits.
 * Returns { payment_hash, checking_id } on success.
 */
async function payInvoice(bolt11) {
  if (DEMO_MODE) {
    return mockPayment(bolt11);
  }

  const res = await fetch(`${LNBITS_URL}/api/v1/payments`, {
    method: 'POST',
    headers: {
      'X-Api-Key': ADMIN_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ out: true, bolt11 }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LNbits payment failed: ${res.status} — ${err}`);
  }

  return res.json();
}

/**
 * Check the status of a payment by its checking_id / payment_hash.
 * Returns { paid: boolean, details: object }
 */
async function checkPaymentStatus(paymentHash) {
  if (DEMO_MODE) {
    return { paid: true, details: { payment_hash: paymentHash } };
  }

  const res = await fetch(`${LNBITS_URL}/api/v1/payments/${paymentHash}`, {
    headers: { 'X-Api-Key': INVOICE_KEY },
  });

  if (!res.ok) {
    return { paid: false, details: null };
  }

  const data = await res.json();
  return { paid: data.paid, details: data };
}

/**
 * Get the wallet balance in millisatoshis.
 */
async function getBalance() {
  if (DEMO_MODE) {
    return { balance_msat: 1_000_000_000, demo: true };
  }

  const res = await fetch(`${LNBITS_URL}/api/v1/wallet`, {
    headers: { 'X-Api-Key': INVOICE_KEY },
  });

  if (!res.ok) throw new Error('Failed to fetch LNbits balance');
  return res.json();
}

// ------------------------------------------------------------------ mocks

function mockInvoice(amountSats, memo) {
  const hash = 'mock_hash_' + Date.now().toString(16);
  return {
    payment_request: `lnbc${amountSats}n1mock_invoice_${hash}`,
    payment_hash: hash,
    checking_id: hash,
    demo: true,
  };
}

function mockPayment(bolt11) {
  const hash = 'mock_paid_' + Date.now().toString(16);
  return {
    payment_hash: hash,
    checking_id: hash,
    bolt11,
    demo: true,
  };
}

module.exports = {
  createInvoice,
  payInvoice,
  checkPaymentStatus,
  getBalance,
  DEMO_MODE,
};
