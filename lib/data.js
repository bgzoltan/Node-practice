import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { helpers } from "./helpers.js";

// Define __filename and __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const lib = {};

lib.baseDir = path.join(__dirname, "../.data/");
lib.create = function (dir, file, data, callback) {
  fs.open(
    lib.baseDir + dir + "/" + file + ".json",
    "wx",
    function (err, fileDescriptor) {
      if (!err && fileDescriptor) {
        const stringData = JSON.stringify(data);
        fs.writeFile(fileDescriptor, stringData, function (err) {
          if (!err) {
            fs.close(fileDescriptor, function (err) {
              if (!err) {
                callback(false);
              } else {
                callback("Error closing new file.");
              }
            });
          } else {
            callback("Error writing to a new file");
          }
        });
      } else {
        callback("Couldn't create new file. It may already exists.");
      }
    }
  );
};

lib.read = function (dir, file, callback) {
  fs.readFile(
    lib.baseDir + dir + "/" + file + ".json",
    "utf8",
    function (err, data) {
      if (!err && data) {
        const parsedData = helpers.parseJsonStringToObject(data);
        callback(null, parsedData);
      } else {
        callback("Cannot read file.", data);
      }
    }
  );
};

lib.update = function (dir, file, data, callback) {
  fs.open(
    lib.baseDir + dir + "/" + file + ".json",
    "r+",
    function (err, fileDescriptor) {
      if (!err && fileDescriptor) {
        const stringData = JSON.stringify(data);
        fs.truncate(lib.baseDir + dir + "/" + file + ".json", function (err) {
          if (!err) {
            fs.writeFile(
              lib.baseDir + dir + "/" + file + ".json",
              stringData,
              function (err) {
                if (!err) {
                  fs.close(fileDescriptor, function (err) {
                    if (!err) {
                      callback(false, data);
                    } else {
                      callback("Error closing the file.");
                    }
                  });
                } else {
                  callback("Couldn't write the file.");
                }
              }
            );
          } else {
            callback("Couldn't empty the file.");
          }
        });
      } else {
        callback(err);
      }
    }
  );
};

lib.delete = function (dir, file, callback) {
  fs.unlink(lib.baseDir + dir + "/" + file + ".json", function (err) {
    if (!err) {
      callback(false);
    } else {
      callback("Couldn't delete the file");
    }
  });
};

lib.list = function (dir, callback) {
  fs.readdir(lib.baseDir + dir + "/", function (err, data) {
    if (!err && data && data.length > 0) {
      let trimmedFileNames = [];
      data.forEach(function (fileName) {
        trimmedFileNames.push(fileName.replace(".json", ""));
      });
      callback(false, trimmedFileNames);
    } else {
      callback(err, data);
    }
  });
};
