This script takes a Cordova 5+ project folder and create a Phonegap Build compliant .zip file and upload it to Phonegap Build.
Really useful into a Continuos Integration build system.

## Installation:
`npm install -g cordova-to-phonegap-build`

## Usage:

### Inside NodeJS applications
You can import this script inside your NodeJS application:

First you need it installed locally:
`npm install cordova-to-phonegap-build`

then you can invoke it within you application

```
const cdvPgb = require('cordova-to-phonegap-build')

cdvPgb.upload(process.cwd(), '$yourPhonegapToken', 'resources')
```

### Using shell command

Script needs the Phonegap Token loaded as Enviromental Variable in order to connect to Phonegap Build, you can retrieve it into _Account settings_ on Phonegap Build site.

`export PGToken="$yourPhonegapToken"`
`tobuild $cordovaProjectDirectory -f resources`

The script creates a .zip file to upload to PhoneGap: Build with "config.xml" and the "www" folder


## Parameters:

### -x/--xml
Load the config.xml from a different location and override the one on main folder.

### -f/--folder folderName
Indicate any other folder to be added to the uploaded file. Required if you use splash/icons external resources folder.
Could be used more times as needed. folderName is relative to the project path.

i.e.: `tobuild --folder resources --folder fonts`

### -t/--token $yourPhonegapToken
You could use your token as params instead of environment variable.  
Token could be obtained also from NPM config.

i.e.: `npm config set pgToken "$yourPhonegapToken"`
will save it in you `~/.npmrc` and you do not need to use in your command or you can save it in your npm package.json `config`
```
"config": {
  "token": "$yourPhonegapToken"
}
```

### -c/--check-version
Before update the app on PG:B a version check is made: if the version of the uploaded is less or equals than the existing one than an exception is throwed.

### -l/--lookup
Keeps process running after upload to look at the current status of the build for every platforms.

### -d/--download
After a build succeed it starts to download into current folder

### -p/--path
Defines a path where to download the build

### -o/--timeout
Specifies the max amount of minutes to wait for _download_ or _lookup_. Defaults to 10, if reached exits with an error.


## Key Management

Keys options are supposed to be defined inside _package.json_ `config` prop in that form:
```
"config": {
  "keys": {
    "android": {
      "name": "Foo",
      "password": "keyBar",
    },
    "ios": {
      "name": "Faa",
      "password": "bor",
    }
  }
}
```

Keys can also be defined by CLI params that override _package.json_ entries.

### --key-android
### --key-ios
Key name of Android and ios key on Phonegap:Build.
It could also be defined as NPM config.

### --key-android-pwd
### --key-ios-pwd
Password for keystore of the Android keystore and iOS certificate.