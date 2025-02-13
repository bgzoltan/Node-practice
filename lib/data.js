import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Define __filename and __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const lib = {};

lib.baseDir = path.join(__dirname, "../.data/");
lib.create = function (dir, file, data, callback) {
  fs.open(dir + "/" + file + ".json", "wx", function (err, fileDescriptor) {
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
  });
};
