#!/usr/bin/env bash
# Build a production AAB locally with Gradle, signed with the same upload
# key EAS uses. Run from the project root: ./scripts/build-local-aab.sh <versionCode>
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

EXPECTED_SHA1="BC:51:DA:F1:34:2F:90:EF:5B:AB:33:EE:84:42:CA:0F:87:E7:6E:1E"
KEYSTORE_PROPS="android/keystore.properties"

log()  { echo "[build-local-aab] $*"; }
fail() { echo "[build-local-aab] ERROR: $*" >&2; exit 1; }

cleanup() {
  if [ -f "$KEYSTORE_PROPS" ]; then
    rm -f "$KEYSTORE_PROPS"
    log "removed $KEYSTORE_PROPS"
  fi
}
trap cleanup EXIT

# --- a. validate requirements -------------------------------------------
VERSION_CODE="${1:-}"
[[ "$VERSION_CODE" =~ ^[0-9]+$ ]] || fail "usage: $0 <versionCode>  (e.g. $0 2)"

command -v java >/dev/null 2>&1 || fail "java not found on PATH"
JAVA_VER="$(java -version 2>&1 | head -1)"
[[ "$JAVA_VER" == *"\"17."* ]] || fail "java 17 required, found: $JAVA_VER"

[ -n "${ANDROID_HOME:-}" ] || fail "ANDROID_HOME is not set"
[ -d "$ANDROID_HOME" ] || fail "ANDROID_HOME does not exist: $ANDROID_HOME"

[ -f "credentials.json" ] || fail "credentials.json not found in project root"
[ -f ".env" ] || fail ".env not found in project root"
[ -f "eas.json" ] || fail "eas.json not found in project root"

KEYSTORE_PATH="$(node -e "console.log(require('./credentials.json').android.keystore.keystorePath)")"
[ -n "$KEYSTORE_PATH" ] || fail "credentials.json has no android.keystore.keystorePath"
[ -f "$KEYSTORE_PATH" ] || fail ".jks not found at $KEYSTORE_PATH (from credentials.json)"

log "requirements OK (java 17, ANDROID_HOME, credentials.json, $KEYSTORE_PATH)"

# --- b. write android/keystore.properties (never echo secrets) ---------
mkdir -p android
node -e "
const fs = require('fs');
const c = require('./credentials.json').android.keystore;
const lines = [
  'storeFile=' + require('path').resolve(c.keystorePath).replace(/\\\\/g, '/'),
  'storePassword=' + c.keystorePassword,
  'keyAlias=' + c.keyAlias,
  'keyPassword=' + c.keyPassword,
  '',
].join('\n');
fs.writeFileSync('$KEYSTORE_PROPS', lines, { mode: 0o600 });
"
[ -f "$KEYSTORE_PROPS" ] || fail "failed to write $KEYSTORE_PROPS"
log "wrote $KEYSTORE_PROPS (gitignored, not printed)"

# --- c. prebuild ---------------------------------------------------------
log "running expo prebuild --platform android --clean"
npx expo prebuild --platform android --clean

# prebuild --clean wipes and regenerates android/, so re-check the
# properties file (it was written before prebuild ran) survived.
if [ ! -f "$KEYSTORE_PROPS" ]; then
  node -e "
  const fs = require('fs');
  const c = require('./credentials.json').android.keystore;
  const lines = [
    'storeFile=' + require('path').resolve(c.keystorePath).replace(/\\\\/g, '/'),
    'storePassword=' + c.keystorePassword,
    'keyAlias=' + c.keyAlias,
    'keyPassword=' + c.keyPassword,
    '',
  ].join('\n');
  fs.writeFileSync('$KEYSTORE_PROPS', lines, { mode: 0o600 });
  "
  log "re-wrote $KEYSTORE_PROPS after prebuild --clean"
fi

# --- d. wire signing config + versionCode into android/app/build.gradle -
GRADLE_FILE="android/app/build.gradle"
[ -f "$GRADLE_FILE" ] || fail "$GRADLE_FILE not found after prebuild"

VERSION_NAME="$(node -e "console.log(require('./app.json').expo.version)")"
[ -n "$VERSION_NAME" ] || fail "app.json has no expo.version"

node -e "
const fs = require('fs');
const path = '$GRADLE_FILE';
let g = fs.readFileSync(path, 'utf8');

const propsLoader = [
  'def keystorePropertiesFile = rootProject.file(\"keystore.properties\")',
  'def keystoreProperties = new Properties()',
  'if (keystorePropertiesFile.exists()) {',
  '    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))',
  '}',
  '',
].join('\n');
if (!g.includes('keystorePropertiesFile')) {
  g = g.replace(/^apply plugin: \"com\.android\.application\"\n/m, (m) => m + '\n' + propsLoader);
}

g = g.replace(/versionCode\s+\d+/, 'versionCode $VERSION_CODE');
g = g.replace(/versionName\s+\"[^\"]*\"/, 'versionName \"$VERSION_NAME\"');

// Point buildTypes.release at the release signing config BEFORE inserting
// our own 'release {' block under signingConfigs below — otherwise this
// regex could match the wrong (just-inserted) 'release {' block.
g = g.replace(/(release\s*\{[^}]*signingConfig\s+signingConfigs\.)debug/s, '\$1release');

if (!/signingConfigs\s*\{[^}]*release/s.test(g)) {
  g = g.replace(/signingConfigs\s*\{/, (m) => m + '\n        release {\n' +
    '            if (keystorePropertiesFile.exists()) {\n' +
    '                storeFile file(keystoreProperties[\"storeFile\"])\n' +
    '                storePassword keystoreProperties[\"storePassword\"]\n' +
    '                keyAlias keystoreProperties[\"keyAlias\"]\n' +
    '                keyPassword keystoreProperties[\"keyPassword\"]\n' +
    '            }\n' +
    '        }\n');
}

if (!/signingConfig\s+signingConfigs\.release/.test(g)) {
  console.error('[build-local-aab] ERROR: could not wire buildTypes.release to signingConfigs.release in ' + path);
  process.exit(1);
}

fs.writeFileSync(path, g);
" || fail "failed to patch $GRADLE_FILE for release signing (unexpected build.gradle shape)"
log "signing config + versionCode=$VERSION_CODE (versionName=$VERSION_NAME) written to $GRADLE_FILE"

# --- e. verify Google client IDs match eas.json production --------------
node -e "
const fs = require('fs');
const dotenv = {};
for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*\$/);
  if (m) dotenv[m[1]] = m[2].replace(/^[\"']|[\"']\$/g, '');
}
const eas = require('./eas.json').build.production.env || {};
const keys = ['EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'];
let ok = true;
for (const k of keys) {
  if (dotenv[k] !== eas[k]) {
    console.error('[build-local-aab] ERROR: ' + k + ' differs between .env and eas.json production');
    ok = false;
  }
}
process.exit(ok ? 0 : 1);
" || fail "Google client ID mismatch between .env and eas.json production env"
log "Google client IDs match eas.json production"

# --- f. gradle bundleRelease --------------------------------------------
log "running gradlew bundleRelease"
(cd android && ./gradlew bundleRelease)

# --- g. copy output -------------------------------------------------------
SRC_AAB="android/app/build/outputs/bundle/release/app-release.aab"
[ -f "$SRC_AAB" ] || fail "expected AAB not found at $SRC_AAB"

mkdir -p build
DEST_AAB="build/darenow-v${VERSION_CODE}.aab"
cp "$SRC_AAB" "$DEST_AAB"
log "copied AAB to $DEST_AAB"

# --- h. verify signature matches EAS upload key --------------------------
ACTUAL_SHA1="$(keytool -printcert -jarfile "$DEST_AAB" 2>/dev/null | grep -i 'SHA1:' | head -1 | sed -E 's/.*SHA1:\s*//')"
[ -n "$ACTUAL_SHA1" ] || fail "could not read signature from $DEST_AAB"

if [ "$ACTUAL_SHA1" != "$EXPECTED_SHA1" ]; then
  rm -f "$DEST_AAB"
  fail "signature mismatch: got $ACTUAL_SHA1, expected $EXPECTED_SHA1 (deleted $DEST_AAB)"
fi
log "signature verified: $ACTUAL_SHA1 matches EAS upload key"

log "done: $DEST_AAB"
# cleanup() runs on EXIT and removes android/keystore.properties
