"use strict"

const pgInterface = require('../lib/pgInterface');
const fsInterface = require('../lib/fsInterface');
const xmlInterface = require('../lib/xmlInterface');

async function upload (mainFolder, extraFolders = [], token, options = {}) {
  pgInterface.auth( token || process.env.npm_package_config_token || process.env.npm_config_pgToken );
  
  const filesToCopy = ['www'].concat(extraFolders);
  const tempFolder = fsInterface.cloneProject(mainFolder, options.xml, filesToCopy, options.resources, options.version);

  const appOptions = {};
  const androidKeyName = ((options.keys || {}).android || {}).name || process.env.npm_package_config_keys_android_name;
  const androidKeyPassword = ((options.keys || {}).android || {}).password || process.env.npm_package_config_keys_android_password;
  const iosKeyName = ((options.keys || {}).ios || {}).name || process.env.npm_package_config_keys_ios_name;
  const iosKeyPassword = ((options.keys || {}).ios || {}).password || process.env.npm_package_config_keys_ios_password;

  if (androidKeyName || iosKeyName) {
    appOptions.keys = {};
    appOptions.keys = await pgInterface.findKeyIds(androidKeyName, iosKeyName);

    // TODO: Code to upload key
    // if (
    //   !appOptions.keys.android &&
    //   (
    //     options.keys.android.name &&
    //     options.keys.android.alias &&
    //     options.keys.android.path && options.keys.android.path.length &&
    //     options.keys.android.password
    //   )
    // ) {
    //   appOptions.keys.android = (await pgInterface.addKey(
    //     'android', [mainFolder].concat(options.keys.android.path), {
    //       title: options.keys.android.name,
    //       alias: options.keys.android.alias,
    //       passwords: options.keys.android.password,
    //       keyPassword: options.keys.android.keyPassword
    //     }
    //   ))
    // }
    // if (
    //   !appOptions.keys.ios &&
    //   (
    //     options.keys.name &&
    //     options.keys.ios.path && options.keys.ios.path.length &&
    //     options.keys.ios.p12 &&
    //     options.keys.ios.password
    //   )
    // ) {
    //   appOptions.keys.ios = (await pgInterface.addKey(
    //     'ios', [mainFolder].concat(options.keys.ios.path), {
    //       title: options.keys.ios.name,
    //       alias: options.keys.ios.p12,
    //       passwords: options.keys.ios.password
    //     }
    //   ))
    // }

    await pgInterface.unlockKeys(appOptions.keys, { android: androidKeyPassword, ios: iosKeyPassword });
  }

  const appData = xmlInterface.getAppData(tempFolder, options.checkVersion);
  const response = await pgInterface.upload(appData, tempFolder, appOptions);

  if (options.lookup || options.download) {
    await pgInterface.lookup(response.id, options.download, options.timeout);
  }
}
exports.upload = upload;
exports.uploadProject = (mainFolder, token, extraFolders) => upload(mainFolder, extraFolders, token);