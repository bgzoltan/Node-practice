import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import zlib from "zlib";

// Define __filename and __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const logs = {};

logs.baseDir = path.join(__dirname, "../.logs/");

logs.append = function (logFileName, stringLogData, callback) {
  fs.open(
    logs.baseDir + logFileName + ".log",
    "a",
    function (err, fileDescriptor) {
      if (!err && fileDescriptor) {
        fs.appendFile(fileDescriptor, stringLogData + "\n", function (err) {
          if (!err) {
            fs.close(fileDescriptor, function (err) {
              if (!err) {
                callback(false);
              } else {
                callback("Error: cannot close the file.");
              }
            });
          } else {
            callback("Error: cannot appending the file.");
          }
        });
      } else {
        callback("Could not open the file.");
      }
    }
  );
};

logs.list = function (includeCompressedLogs, callback) {
  fs.readdir(logs.baseDir, function (err, data) {
    if (!err && data && data.length > 0) {
      let trimmedFileNames = [];
      data.forEach(function (fileName) {
        if (fileName.indexOf(".log") > -1) {
          trimmedFileNames.push(fileName.replace(".log", ""));
        }

        if (fileName.indexOf(".gz.b64") > -1 && includeCompressedLogs) {
          trimmedFileNames.push(fileName.replace(".gz.B64", ""));
        }
      });
      callback(false, trimmedFileNames);
    } else {
    }
  });
};

logs.compress = function (logId, newFileId, callback) {
  let sourceFile = logId + ".log";
  let destFile = newFileId + ".gz.b64";

  fs.readFile(logs.baseDir + sourceFile, "utf8", function (err, inputString) {
    if (!err && inputString) {
      zlib.gzip(inputString, function (err, buffer) {
        if (!err && buffer) {
          fs.open(
            logs.baseDir + destFile,
            "wx",
            function (err, fileDescriptor) {
              if (!err && fileDescriptor) {
                fs.writeFile(
                  fileDescriptor,
                  buffer.toString("base64"),
                  function (err) {
                    if (!err) {
                      fs.close(fileDescriptor, function (err) {
                        if (!err) {
                          callback(false);
                        } else {
                          console.log(err);
                          callback(
                            "Error: could not close the compressed file."
                          );
                        }
                      });
                    } else {
                      console.log(err);
                      callback("Error: could not write the compressed file.");
                    }
                  }
                );
              } else {
                console.log(err);
                callback("Error: opening the destination file.");
              }
            }
          );
        } else {
          console.log(err);
          callback("Error: compressing the file.");
        }
      });
    } else {
      console.log(err);
      callback("Error: reading the source file.");
    }
  });
};

logs.decompress = function (fileId, callback) {
  let fileName = fileId + ".gz.b64";
  fs.readFile(logs.baseDir + fileName, "utf8", function (err, str) {
    if (!err && str) {
      let inputBuffer = Buffer.from(str, "base64");
      zlib.unzip(inputBuffer, function (err, outputBuffer) {
        if (!err && outputBuffer) {
          let str = outputBuffer.toString();
          callback(false, str);
        } else {
          callback(err);
        }
      });
    } else {
      callback(err);
    }
  });
};

logs.truncate = function (logId, callback) {
  fs.truncate(logs.baseDir + logId + ".log", function (err) {
    if (!err) {
      callback(false);
    } else {
      callback(err);
    }
  });
};
