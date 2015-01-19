import path from 'path';
import fs from 'fs';

export default class Config {
  constructor(configFile) {
    this.configPath = path.resolve(configFile);
  }

  parse() {
    var baseDir = path.dirname(this.configPath);

    // this.config = this._getJSONFile(this.configPath);
    // this.template = this._getFile(this.config.template, baseDir);
    return this._getFile(this.configPath).then((config) => {
      this.config = JSON.parse(config);
      this.packageJSON = this.config.packageJSON;

      //port the server runs on
      this.port = this.config.port || 8080;

      //look into anchor tags?
      this.anchors = this.config.anchors || true;

      //build directory
      this.buildDir = this.config.buildDir;

      var filePaths = ['template', 'routes', 'clientRoutes', 'serverRoutes']
        .map((name) => this.config[name]);

      //defaults
      if (!filePaths[0]) filePaths[0] = path.resolve(__dirname, '../defaults/template.hb');
      [1,2,3].map((i) => { if (!filePaths[i]) filePaths[i] = path.resolve(__dirname, '../defaults/route.json'); });

      return this._getFiles(filePaths, baseDir);
    }).then((files) => {
      this.template = files[0];
      this.routes = JSON.parse(files[1]);
      this.clientRoutes = JSON.parse(files[2]);
      this.serverRoutes = JSON.parse(files[3]);
    });
  }

  _getFile(file, relativeTo='') {
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(relativeTo, file), "utf-8", (error, data) => {
        if (!error) return resolve(data);

        fs.readFile(file, "utf-8", (error, data) => {
          if (error) return reject(error);
          else return resolve(data);
        });
      });
    });
  }

  _getFiles(files, relativeTo='') {
    return new Promise((resolve, reject) => {
      let results = [], finished  = 0;

      files.map((file, i) => {
        this._getFile(file, relativeTo).then((file) => {
          results[i] = file;

          if (++finished == files.length) return resolve(results);
        }).catch((error) => {
          return reject(error);
        });
      });
    });
  }
}
