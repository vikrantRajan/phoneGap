#!/usr/bin/env node
"use strict"

const meow = require('meow');
const helper = require('../lib/helper');
const helpMessage =
`
  Usage
    $ tobuild <projectFolder>

  Options
    --xml, -x            Load the config.xml from a different location and override the one on main folder;
    --resources, -x      Load resources from external folder;
    --app-version, -a        Force version of package;

    --folder, -f         Include this folder into the build;
    --token, -t          Use a specific token to authorize in PGB;
    --lookup, -l         Wait till all builds succeed or fail;
    --download, -d       Download a build after it succeeds;
    --timeout, -o        Max timeout in minutes to wait for lookup or download;
    --path, -p           Specify a path for the downloaded build;
    --check-version, -c  Verify that uploaded version is bigger than the one on cloud;

    --key-android        Name of the Android key on PGB;
    --key-ios            Name of the iOS key on PGB;
    --key-android-pwd    Password for the Android key on PGB;
    --key-ios-pwd        Password for the iOS key on PGB;

  Examples
    $ tobuild /path/to/project -f resources -l
    $ tobuild /path/to/project -f resources --key-ios "iOSCert" --key-ios-pwd "iOSCertPassword" -d -p "~/Downloads"
`

const cli = meow(
  helpMessage,
  {
    flags: {
      xml: { type: 'string', alias: 'x' },
      resources: { type: 'string', alias: 'r' },
      appVersion: { type: 'string', alias: 'a' },

      folder: { type: 'string', alias: 'f' },
      token: { type: 'string', alias: 't' },
      lookup: { type: 'boolean', alias: 'l' },
      download: { type: 'boolean', alias: 'd' },
      path: { type: 'string', alias: 'p' },
      checkVersion: { type: 'boolean', alias: 'c'},

      keyAndroid: { type: 'string' },
      keyIos: { type: 'string' },
      keyAndroidPwd: { type: 'string' },
      keyIosPwd: { type: 'string' },
      // keyAlias: { type: 'string' },
      // keyAliasPwd: { type: 'string' },
      // keyKeystore: { type: 'string' },
      // keyMobprov: { type: 'string' },
      // keyP12: { type: 'string' }
    }
  }
);

(async () => {
  try {
    const keys = {
      android: {
        name: cli.flags.keyAndroid,
        password: cli.flags.keyAndroidPwd
      },
      ios: {
        name: cli.flags.keyIos,
        password: cli.flags.keyIosPwd
      }
    };
    // keys.android.alias = cli.flags.keyAlias || keys.android.alias;
    // keys.android.path = cli.flags.keyKeystore ? cli.flags.keyKeystore.split('/') : keys.android.path;
    // keys.android.keyPassword = cli.flags.keyAliasPwd || keys.android.keyPassword || keys.android.password;
    // keys.ios.path = cli.flags.keyMobprov ? cli.flags.keyMobprov.split('/') : keys.ios.path;
    // keys.ios.p12 = cli.flags.keyP12 ? cli.flags.keyP12.split('/') : keys.ios.p12;

    switch (cli.input[0]) {

      default:
        await helper.upload(
          cli.input[0],
          cli.flags.folder,
          cli.flags.token,
          {
            xml: cli.flags.xml,
            resources: cli.flags.resources,
            version: cli.flags.appVersion,
            lookup: cli.flags.lookup,
            download: cli.flags.path || cli.flags.download,
            keys: (keys.android.name || keys.ios.name) ? keys : null,
            timeout: cli.flags.timeout,
            checkVersion: cli.flags.checkVersion
          }
        );
    }

  } catch (err) {
    const message = err.message;
    console.error()
    console.error(message.red)
    console.error();
    process.exit(5);
  }
})()
