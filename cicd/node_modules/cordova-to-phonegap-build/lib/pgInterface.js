const pgb = require('pgb-api')();
const { join } = require('path');
const colors = require('colors'); // Keep to extend String prototype to add colors

exports.auth = function auth (pgToken) {
  if (!pgToken) { throw { message: 'No PGToken defined.'}; }
  pgb.addAuth(pgToken);
}

/**
 * 
 * @param {string} oldVersion old version of the app in the format x.x.x[.x]
 * @param {string} newVersion new version of the app in the format x.x.x[.x]
 */
function compareVersion (oldVersion, newVersion) {
  if (!newVersion) { return 1; }
  const oldSplitted = oldVersion.split('.');
  const newSplitted = newVersion.split('.');
  for (let i = 0; i < newSplitted.length; i++) {
    const o = +(oldSplitted[i] || 0);
    const n = +newSplitted[i];
    if (o > n) { return -1; }
    if (o < n) { return +1; }
  }
  // If all checks previous digits are equals and oldVersion has more digits than new: 1.0.1.1 vs 1.0.1
  if (oldSplitted.length > newSplitted.length) { return -1; }
  return 0;
}

/**
 * Iterate through all the apps on PGB to find ID of already updated. If exists.
 * @param {string} appId App ID of the App as it's reported in config.xml
 * @param {string} newVersion version of the app currently being uploaded
 */
async function searchForPGBId (appId, newVersion = null) {
  const existingApps = (await pgb.getApps()).apps;
  let buildId = 0;
  for (let i = 0, appData; i < existingApps.length; i++) {
    appData = existingApps[i];
    if (appData.package === appId) {
      buildId = appData.id;
      if (compareVersion(appData.version, newVersion) <= 0) {
        throw { message: `Version uploaded (${newVersion}) is less or equal than existing one (${appData.version})` };
      }
      break;
    }
  }
  return buildId;
}

/**
 * 
 * @param {object} appData App data retrieved from XML: { appId, appVersion }
 * @param {string} folderPath Path of the folder config.xml and www folder
 * @param {object} appOptions Object to add app options as defined for pgb-api.addApp/updateApp
 */
async function upload (appData, folderPath, appOptions) {
  if (!pgb.hasAuth()) { throw { message: 'PG:B Auth not defined.'}; }
  const appId = appData.id;
  const appVersion = appData.version;
  let appResponse;
  const pgbId = await searchForPGBId(appId, appVersion);
  if (pgbId) {
    console.log(`Update existing app: ${pgbId}`);
    appResponse = await pgb.updateApp(pgbId, folderPath, appOptions);
  } else {
    console.log(`Create new app: ${appId}`);
    appResponse = await pgb.addApp(folderPath, appOptions);
  }
  console.log(`App uploaded succesfully`);
  console.log(`\tInstall URL: ${appResponse.install_url.green}`);

  return appResponse;
}
exports.upload = upload;

async function lookup (pgbId, downloadPath, timeout) {
  // Look if it's a valid PGBID or if its an appId
  if (isNaN(+pgbId)) { pgbId = await searchForPGBId(pgbId); }
  if (downloadPath === true) { downloadPath = '.'; }
  timeout = +timeout;
  if (isNaN(timeout) || !timeout) { timeout = 10; }
  timeout = timeout * 60 * 1000;

  console.log(`\nLookup for app building status:`);

  const mainStatus = [
    { platform: 'android', status: 'pending' },
    { platform: 'ios', status: 'pending' },
    { platform: 'winphone', status: 'pending' }
  ];
  const statusColor = { complete: 'green', error: 'red' };

  let checkInterval = 5000;
  let checkIntervalMultiplier = 1.2;
  let checkTimeoutId;
  let mainTimeout;

  async function checkForStatus (resolve, reject) {
    const appData = await pgb.getApp(pgbId);
    const pendingElement = mainStatus
    .filter(el => appData.status[el.platform] !== 'skip')
    .map(el => {
      let newStatus = appData.status[el.platform];
      if (el.status !== newStatus) {
        let message = `${el.platform}: ${newStatus[statusColor[newStatus] || 'yellow']}`;
        if (newStatus === 'error') {
          message += `: ${appData.error[el.platform]}`.red;
          message += `\n\tlog: ${appData.logs[el.platform].replace('/api/v1', 'https://build.phonegap.com')}`;
        }
        console.log(message);
      }
      el.status = newStatus;
      if (el.status === 'complete' && downloadPath) {
        const fileName = `${appData.title}_${appData.version}.${appData.build_count}.${el.platform === 'ios' ? 'ipa' : 'apk'}`;
        const filePath = join(downloadPath, fileName);
        console.log(`Downloading ${el.platform} version: ${filePath}`);
        pgb.downloadApp(pgbId, el.platform, filePath);
      }
      return el;
    })
    .filter(el => (el.status !== 'complete' && el.status !== 'error'))

    if (!pendingElement.length) {
      clearTimeout(mainTimeout);
      return resolve(appData);
    }
    checkInterval = checkInterval * checkIntervalMultiplier;
    checkTimeoutId = setTimeout(() => checkForStatus(resolve,reject), checkInterval);
  }

  return new Promise((resolve, reject) => {
    checkForStatus(resolve, reject);
    mainTimeout = setTimeout(() => {
      checkForStatus(resolve, reject);
      clearTimeout(checkTimeoutId);
      return reject({ message: `Reached timeout of ${(timeout / 60 / 1000).toFixed(0)} min` });
    }, timeout)
  });
}
exports.lookup = lookup;

/**
 * 
 * @param {object} keyIds ids of the keys in a Object { android: id, ios: id }
 * @param {object} passwords Unlock passwords for key in a Object { android: { keystore, key }, ios }. If keystore and key are the same you could provide a string for "android" property.
 */
async function unlockKeys (keyIds, passwords) {
  const androidId = keyIds.android;
  const iosId = keyIds.ios;

  const androidKeystore = (passwords.android || {}).keystore || passwords.android;
  const androidKey      = (passwords.android || {}).key || passwords.android;
  const iosKey          = passwords.ios

  if (androidId && (!androidKeystore || !androidKey)) {
    console.log(`WARNING: Android key or keystore password not provided.`);
  }
  if (iosId && !iosKey) {
    console.log(`WARNING: iOS key password not provided.`);
  }


  let androidRespose = null;
  let iosRespose = null;
  if (androidId && androidKeystore && androidKey) {
    console.log(`- Unlocking Android Key: ${androidId}`);
    androidRespose = await pgb.unlockAndroidKey(androidId, androidKeystore, androidKey)
    .catch(err => {
      console.log(`WARNING: Error while unlockin ${androidId} key`.yellow);
      return false;
    });
  }
  if (iosId && iosKey) {
    console.log(`- Unlocking iOS Key: ${iosId}`);
    iosRespose = await pgb.unlockIOSKey(iosId, iosKey)
    .catch(err => {
      console.log(`WARNING: Error while unlockin ${iosId} key`.yellow);
      return false;
    });
  }
  
  if ((androidId || iosId) && (!androidRespose && !iosRespose)) {
    throw { message: `Unable to unlock any keys for this project` };
  }

  return true;
}
exports.unlockKeys = unlockKeys;

async function addKey (platform, filePath, options = {}) {
  let keyData;
  filePath = join(...filePath);
  switch (platform) {
    case 'android':
      console.log('Creating key for Android');
      keyData = await pgb.addAndroidKey(
        options.title,
        options.alias,
        filePath,
        {
          keystore_pw: options.password,
          key_pw: options.keyPassword
        }
      );
      break;
    case 'ios':
      console.log('Creating key for iOS');
      keyData = await pgb.addIOSKey(
        options.title,
        filePath,
        options.p12,
        {
          default: false,
          password: options.password
        }
      );
      break;
    default:
      throw { message: `Wrong platform for addKey method: ${platform}` };
  }

  return keyData;
}
exports.addKey = addKey;

/**
 * Retrieve IDs of keys given an App Name
 * @param {string} keyName name of the key on PGB
 */
async function findKeyIds (androidKeyName, iosKeyName) {
  if (!androidKeyName && !iosKeyName) { throw { message: `Key name to find not provided` }; }

  const data = await pgb.getKeys();
  const androidKeyId = lookForKeyName(data.keys.android.all, androidKeyName);
  const iosKeyId = lookForKeyName(data.keys.ios.all, iosKeyName);
  const keyIds = {};
  if (androidKeyId) { keyIds.android = androidKeyId; }
  if (iosKeyId) { keyIds.ios = iosKeyId; }
  
  function lookForKeyName (keys, title) {
    for (let key of keys) {
      if (key.title === title) { return key.id; }
    }
    return null;
  }

  if (androidKeyName && !keyIds.android) { `WARNING: No key "${androidKeyName}" found for Android`.yellow };
  if (iosKeyName && !keyIds.ios) { `WARNING: No key "${iosKeyName}" found for iOS`.yellow };

  return keyIds;
}
exports.findKeyIds = findKeyIds;