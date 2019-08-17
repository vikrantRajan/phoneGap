"use strict"

const fs = require('fs');
const { join } = require('path');
const { parse, j2xParser } = require('fast-xml-parser');

const parserConfig = {
  attributeNamePrefix : '',
  attrNodeName: '$',
  textNodeName : '_',
  ignoreAttributes : false,
  ignoreNameSpace : false,
  allowBooleanAttributes : true,
  parseNodeValue : true,
  parseAttributeValue : true
}

exports.getAppData = function getAppData (folder, withVersion = false) {

  // console.log('Reading Cordova config.xml');
  const configXmlData = fs.readFileSync(join(folder, 'config.xml'), { encoding: 'UTF8' });

  const configXml = parse(configXmlData, parserConfig);

  const appData = {
    id: configXml.widget.$.id,
    version: withVersion ? configXml.widget.$.version : null
  };
  console.log(`Using ID: ${appData.id}`);
  
  return appData;
}

/**
 * Returns a well formatted 3 dot separated values version. Compatible with both iOS and Android
 * @param {string} version Version for the build to override configXml version
 */
function normalizeVersion (version) {
  if (!version || typeof version !== 'string') { version = '0.0.1'; }
  const splitted = version.split('.');
  return (splitted[0] || '0') + '.' + (splitted[1] || '0') + '.' + (splitted[2] || '0');
}

exports.changeVersion = function changeVersion (folder, version) {
  const configXmlData = fs.readFileSync(join(folder, 'config.xml'), { encoding: 'UTF8' });
  const configXml = parse(configXmlData, parserConfig);
  // iOS won't accept versions with more than 3 values
  configXml.widget.$.version = normalizeVersion(version);
  const converter = new j2xParser(parserConfig);
  const xmlFile = converter.parse(configXml);
  fs.writeFileSync(join(folder, 'config.xml'), xmlFile, { encoding: 'UTF8' });
}