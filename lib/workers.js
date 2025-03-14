import https from "https";
import http from "http";
import { lib } from "../lib/data.js";
import { helpers } from "../lib/helpers.js";
import { logs } from "../lib/logs.js";
import util from "util";
let debug = util.debuglog("workers");

let workers = {};

workers.gatherAllChecks = function () {
  lib.list("checks", function (err, checks) {
    if (!err && checks && checks.length > 0) {
      checks.forEach((check) => {
        lib.read("checks", check, function (err, originalCheckData) {
          if (!err && originalCheckData) {
            workers.validateCheckData(originalCheckData);
          } else {
            debug("Error: reading on of trhe check data.");
          }
        });
      });
    } else {
      debug("Error: could not find any checks..");
    }
  });
};

workers.validateCheckData = function (originalCheckData) {
  originalCheckData =
    typeof originalCheckData === "object" && originalCheckData != null
      ? originalCheckData
      : {};
  originalCheckData.id =
    typeof originalCheckData.id === "string" &&
    originalCheckData.id.length === 20
      ? originalCheckData.id.trim()
      : false;
  originalCheckData.userEmail =
    typeof originalCheckData.userEmail === "string"
      ? originalCheckData.userEmail.trim()
      : false;
  originalCheckData.protocol =
    typeof originalCheckData.protocol === "string" &&
    ["http", "https"].includes(originalCheckData.protocol)
      ? originalCheckData.protocol
      : "";
  originalCheckData.url =
    typeof originalCheckData.url === "string" &&
    originalCheckData.url.trim().length > 0
      ? originalCheckData.url
      : "";
  originalCheckData.method =
    typeof originalCheckData.method === "string" &&
    ["post", "get", "put", "delete"].includes(originalCheckData.method)
      ? originalCheckData.method
      : "";
  originalCheckData.successCodes =
    typeof originalCheckData.successCodes === "object" &&
    originalCheckData.successCodes instanceof Array &&
    originalCheckData.successCodes.length > 0
      ? originalCheckData.successCodes
      : false;
  originalCheckData.timeoutSeconds =
    typeof originalCheckData.timeoutSeconds === "number" &&
    originalCheckData.timeoutSeconds % 1 === 0 &&
    originalCheckData.timeoutSeconds >= 1 &&
    originalCheckData.timeoutSeconds <= 5
      ? originalCheckData.timeoutSeconds
      : false;

  originalCheckData.state =
    typeof originalCheckData.state === "string" &&
    ["up", "down"].includes(originalCheckData.state)
      ? originalCheckData.state
      : "down";
  originalCheckData.lastChecked =
    typeof originalCheckData.lastChecked === "number" &&
    originalCheckData.lastChecked > 0
      ? originalCheckData.lastChecked
      : false;

  if (
    originalCheckData.id &&
    originalCheckData.userEmail &&
    originalCheckData.protocol &&
    originalCheckData.method &&
    originalCheckData.url &&
    originalCheckData.successCodes &&
    originalCheckData.timeoutSeconds
  ) {
    workers.performCheck(originalCheckData);
  } else {
    debug("Error: one of the check is not properly formatted.");
  }
};

workers.performCheck = function (originalCheckData) {
  const checkOutcome = {
    error: false,
    responseCode: false,
  };

  let outcomeSent = false;
  const parsedUrl = new URL(
    originalCheckData.protocol + "://" + originalCheckData.url
  );

  const hostName = parsedUrl.hostname;
  const path = parsedUrl.path;

  const requestDetails = {
    protocol: originalCheckData.protocol + ":",
    hostname: hostName,
    method: originalCheckData.method.toUpperCase(),
    path: path,
    timeout: originalCheckData.timeoutSeconds * 1000,
  };

  const _moduleToUse = originalCheckData.protocol === "http" ? http : https;
  const req = _moduleToUse.request(requestDetails, function (res) {
    const status = res.statusCode;
    checkOutcome.responseCode = status;
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  req.on("error", function (err) {
    checkOutcome.error = { error: true, value: err };
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  req.on("timeout", function () {
    checkOutcome.error = { error: true, value: "timeout" };
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  req.end();
};

workers.processCheckOutcome = function (originalCheckData, checkOutcome) {
  const state =
    !checkOutcome.error &&
    checkOutcome.responseCode &&
    originalCheckData.successCodes.includes(checkOutcome.responseCode)
      ? "up"
      : "down";
  const alertWanted =
    originalCheckData.lastChecked && originalCheckData.state !== state
      ? true
      : false;

  const timeOfCheck = Date.now();
  workers.log(originalCheckData, checkOutcome, alertWanted, state, timeOfCheck);
  const newCheckData = {
    ...originalCheckData,
    state: state,
    lastChecked: timeOfCheck,
  };

  lib.update("checks", originalCheckData.id, newCheckData, function (err) {
    if (!err) {
      if (alertWanted) {
        workers.alertUserToStatusChange(newCheckData);
      } else {
        debug("CheckOutcome has not changed. Alert is not needed.");
      }
    } else {
      debug("Error: cannot update one of the checks.");
    }
  });
};

workers.alertUserToStatusChange = function (newCheckData) {
  const message =
    "You check for " +
    newCheckData.method.toUpperCase() +
    " " +
    newCheckData.protocol +
    "://" +
    newCheckData.url +
    " is " +
    newCheckData.state;

  helpers.sendTwilioSms("425290589", message, function (err) {
    if (!err) {
      debug("Success: user was alerted to a status change");
    } else {
      debug("Could not send an sms to user to alert!");
    }
  });
};

workers.log = function (
  originalCheckData,
  checkOutcome,
  alertWanted,
  state,
  timeOfCheck
) {
  const logData = {
    check: originalCheckData.check,
    outcome: checkOutcome,
    state: state,
    alert: alertWanted,
    time: timeOfCheck,
  };

  const stringLogData = JSON.stringify(logData);
  const logFileName = originalCheckData.id;

  logs.append(logFileName, stringLogData, function (err) {
    if (!err) {
      debug("Logging to file was succesfull.");
    } else {
      debug("Logging to file failed.");
    }
  });
};

workers.loop = function () {
  setInterval(() => {
    workers.gatherAllChecks();
  }, 1000 * 20);
};

workers.rotateLogs = function () {
  logs.list(false, function (err, allLog) {
    if (!err && allLog && allLog.length > 0) {
      allLog.forEach((logName) => {
        const logId = logName.replace(".log", "");
        const newFileId = logId + "-" + Date.now();
        logs.compress(logId, newFileId, function (err) {
          if (!err) {
            logs.truncate(logId, function (err) {
              if (!err) {
                debug("\x1b[32m%s\x1b[0m", "Success truncating logFile");
              } else {
                debug("\x1b[31m%s\x1b[0m", "Error truncating logFile");
              }
            });
          } else {
            debug(
              "\x1b[31m%s\x1b[0m",
              "Error compressing one of the files",
              err
            );
          }
        });
      });
    } else {
      debug("Error: could not find any logs to rotate.");
    }
  });
};

workers.logRotationLoop = function () {
  setInterval(() => {
    workers.rotateLogs();
  }, 1000 * 60 * 60 * 24);
};

workers.init = function () {
  debug("\x1b[33m%s\x1b[0m", "Background workers are running.");
  workers.gatherAllChecks();
  workers.loop();
  workers.rotateLogs();
};

export default workers;
