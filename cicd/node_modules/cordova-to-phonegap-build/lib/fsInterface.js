"use strict"

const fs = require('fs-extra');
const os = require('os');
const { join } = require('path');
const { changeVersion } = require('./xmlInterface');
// const archiver = require('archiver');

// Useless zipFolder because using native PGB-API
// exports.zipFolder = function zipFolder (folderPath) {
//   return new Promise((resolve,reject) => {
//     const zipPath = join(os.tmpdir(), `pgb-${process.pid}.zip`);

//     console.log(`Create zip file: ${zipPath}`);
//     const archive = archiver('zip');
//     const output = fs.createWriteStream(zipPath);

//     output.on('close', () => {
//       console.log(`Zip file completed: ${(archive.pointer() / (1024 * 1024)).toFixed(2)} MB`);
//       resolve(zipPath);
//     })
//     archive.on('error', err => reject(err));
//     archive.on('warning', err => console.log(`WARN: ${err.message}`.yellow));
//     archive.pipe(output);
//     archive.directory(folderPath, false);
//     archive.finalize();
//   })
// }

exports.cloneProject = function cloneProject (projectPath, configXml = 'config.xml', filesToAdd = [], resources, version) {
  console.log(`Clonig project from ${projectPath}`);
  const tempPath = join(os.tmpdir(), `pgb-${process.pid}`);

  if (!projectPath || !fs.statSync(projectPath).isDirectory()) {
    throw { message: `${projectPath} is not a valid directory` };
  }

  fs.emptydirSync(tempPath);
  filesToAdd.forEach(el => { fs.copySync(join(projectPath, el), join(tempPath, el)); })
  fs.copySync(join(projectPath, configXml), join(tempPath, 'config.xml'));
  if (version) { changeVersion(tempPath, version); }
  if (resources) { fs.copySync(join(projectPath, resources), join(tempPath, 'resources')); }

  return tempPath;
}
