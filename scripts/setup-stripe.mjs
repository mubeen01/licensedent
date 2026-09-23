// One-shot setup: creates the 4 real Stripe Products + one-time Prices this
// app needs (src/payment/plans.ts -- all 4 plans are `{ kind: 'access' }`,
// i.e. one-time payments, never subscriptions) and writes the resulting
// price ids straight into .env.server's PAYMENTS_*_PLAN_ID vars, replacing
// the `012345` placeholders. getPlanAvailability (src/payment/operations.ts)
// checks those vars live and only stops showing "Coming soon" on /pricing
// once they're real -- this script is the other half of that gate.
//
// Idempotent: each Price is tagged with a stable `lookup_key`
// (licensedent_<plan>), so re-running this after a partial failure reuses
// whatever was already created instead of creating duplicates.
//
// Usage: STRIPE_API_KEY=sk_test_... node scripts/setup-stripe.mjs
// (or just have a real STRIPE_API_KEY already sitting in .env.server --
// the script reads it from there if it's not in the environment)
import Stripe from 'stripe';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');
const envPath = path.join(appRoot, '.env.server');

function readEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const vars = {};
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) vars[match[1]] = match[2];
  }
  return vars;
}

const envFileVars = readEnvFile(envPath);
const apiKey = process.env.STRIPE_API_KEY || envFileVars.STRIPE_API_KEY;

if (!apiKey || apiKey === 'sk_test_...' || !apiKey.startsWith('sk_')) {
  console.error(
    'No real STRIPE_API_KEY found (checked env and .env.server). ' +
      'Put a real test or live secret key (starts with sk_test_ or sk_live_) ' +
      'in .env.server\'s STRIPE_API_KEY line, then re-run this script.'
  );
  process.exit(1);
}

const stripe = new Stripe(apiKey, { apiVersion: '2025-04-30.basil' });

// Mirrors src/payment/plans.ts (getPlanPrice) and
// src/landing-page/contentSections.ts's pricingTeaserPlans -- kept as plain
// data here (not imported) so this plain Node script has zero dependency on
// the app's TS build.
const PLANS = [
  {
    envVar: 'PAYMENTS_FAST_TRACK_PLAN_ID',
    lookupKey: 'licensedent_fast_track',
    name: 'LicenseDent — Fast Track',
    description: 'For an exam booked in the next few weeks. Full question bank for 1 exam, 1 month, unlimited practice + timed mock tests.',
    amountUsd: 100,
  },
  {
    envVar: 'PAYMENTS_STANDARD_PLAN_ID',
    lookupKey: 'licensedent_standard',
    name: 'LicenseDent — Standard',
    description: 'The most popular runway before exam day. Full question bank for 1 exam, 3 months, recall bank, flashcards, image MCQs, progress analytics.',
    amountUsd: 200,
  },
  {
    envVar: 'PAYMENTS_EXTENDED_PLAN_ID',
    lookupKey: 'licensedent_extended',
    name: 'LicenseDent — Extended',
    description: 'Every Gulf exam (DHA, HAAD, MOH, SMLE, OMSB, QCHP, KMLE, NHRA, SHA), one plan, 6 months. Recall bank, flashcards, image MCQs, Custom Quiz Builder.',
    amountUsd: 500,
  },
  {
    envVar: 'PAYMENTS_IRELAND_PATHWAY_PLAN_ID',
    lookupKey: 'licensedent_ireland_pathway',
    name: 'LicenseDent — IDC Pathway',
    description: 'IDC Ireland only. Full question bank, structured Lessons with gated quizzes, 6 months.',
    amountUsd: 650,
  },
];

async function ensurePrice(plan) {
  const existing = await stripe.prices.list({ lookup_keys: [plan.lookupKey], active: true, limit: 1 });
  if (existing.data.length > 0) {
    console.log(`  reusing existing price for ${plan.name}: ${existing.data[0].id}`);
    return existing.data[0].id;
  }

  const product = await stripe.products.create({
    name: plan.name,
    description: plan.description,
    metadata: { app: 'licensedent' },
  });
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: plan.amountUsd * 100,
    currency: 'usd',
    lookup_key: plan.lookupKey,
  });
  console.log(`  created ${plan.name}: product ${product.id}, price ${price.id} ($${plan.amountUsd})`);
  return price.id;
}

function updateEnvServer(results) {
  if (!existsSync(envPath)) {
    console.warn(`${envPath} does not exist -- skipping file update, printing results only.`);
    return;
  }
  let content = readFileSync(envPath, 'utf8');
  for (const [envVar, priceId] of Object.entries(results)) {
    const lineRe = new RegExp(`^${envVar}=.*$`, 'm');
    if (lineRe.test(content)) {
      content = content.replace(lineRe, `${envVar}=${priceId}`);
    } else {
      // PAYMENTS_IRELAND_PATHWAY_PLAN_ID may not exist yet in an older .env.server
      content += `\n${envVar}=${priceId}\n`;
    }
  }
  writeFileSync(envPath, content);
  console.log(`\nUpdated ${envPath} with the ${Object.keys(results).length} price ids above.`);
}

async function main() {
  console.log(`Using Stripe key ${apiKey.slice(0, 12)}... (${apiKey.startsWith('sk_live_') ? 'LIVE' : 'test'} mode)\n`);
  const results = {};
  for (const plan of PLANS) {
    results[plan.envVar] = await ensurePrice(plan);
  }
  updateEnvServer(results);
  console.log(
    '\nDone. Restart `wasp start` (env vars are only read at process start) so ' +
      'getPlanAvailability picks up the real price ids and /pricing stops showing "Coming soon".'
  );
  console.log(
    '\nStill manual (not created by this script):\n' +
      '  - STRIPE_WEBHOOK_SECRET: run `stripe listen --forward-to localhost:3001/payments-webhook` ' +
      'for local dev, or create a webhook endpoint for /payments-webhook in the Stripe Dashboard for production.\n' +
      '  - STRIPE_CUSTOMER_PORTAL_URL: Stripe Dashboard -> Settings -> Billing -> Customer portal.'
  );
}

main().catch((err) => {
  console.error('Stripe setup failed:', err.message || err);
  process.exit(1);
});
