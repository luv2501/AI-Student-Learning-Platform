/**
 * Diagnoses the MongoDB connection without ever printing secrets.
 * Only shape checks and an error category are reported:
 *   npm --prefix server run check:db
 */
import 'dotenv/config';
import mongoose from 'mongoose';

const uri = process.env.MONGO_URI || '';

console.log('\nMONGO_URI shape check');
console.log(`  present            : ${uri.length > 0}`);
console.log(`  length             : ${uri.length} chars`);
console.log(`  scheme             : ${uri.startsWith('mongodb+srv://') ? 'mongodb+srv' : uri.startsWith('mongodb://') ? 'mongodb' : 'MISSING/INVALID'}`);
console.log(`  has placeholders   : ${/[<>]/.test(uri)}`);
console.log(`  has credentials    : ${/\/\/[^/@]+:[^/@]+@/.test(uri)}`);
console.log(`  has database name  : ${/\.net\/[a-zA-Z0-9_-]+/.test(uri) || /:\d+\/[a-zA-Z0-9_-]+/.test(uri)}`);
console.log(`  surrounding quotes : ${/^["']|["']$/.test(uri)}`);
console.log(`  whitespace inside  : ${/\s/.test(uri)}`);

if (!uri) {
  console.log('\nresult: MONGO_URI is not set in server/.env\n');
  process.exit(1);
}

console.log('\nconnecting (10s timeout)...');

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`  connected to database: ${mongoose.connection.name}`);
  await mongoose.disconnect();
  console.log('\nresult: connection OK\n');
  process.exit(0);
} catch (err) {
  const raw = `${err.name}: ${err.message}`;
  let diagnosis = 'Unrecognised error.';

  if (/EBADNAME|ENOTFOUND|querySrv/i.test(raw)) {
    diagnosis =
      'DNS could not resolve the cluster host. The cluster address in MONGO_URI is wrong, ' +
      'or the <cluster> placeholder was not replaced.';
  } else if (/bad auth|Authentication failed|SCRAM/i.test(raw)) {
    diagnosis =
      'Cluster was reached but the credentials were rejected. Check the Atlas database ' +
      'user name/password (special characters must be percent-encoded).';
  } else if (/whitelist|IP address|not allowed to connect/i.test(raw)) {
    diagnosis = 'Your current IP is not in the Atlas Network Access allowlist.';
  } else if (/ETIMEDOUT|ServerSelectionError|timed out/i.test(raw)) {
    diagnosis =
      'Could not reach the cluster before the timeout. Usually the Atlas IP allowlist, ' +
      'a paused cluster, or a firewall blocking port 27017.';
  } else if (/Invalid scheme|Invalid connection string|URI malformed/i.test(raw)) {
    diagnosis = 'MONGO_URI is malformed. It must start with mongodb+srv:// or mongodb://';
  }

  console.log(`  error type: ${err.name}`);
  console.log(`\nresult: connection FAILED\n  ${diagnosis}\n`);
  process.exit(1);
}
