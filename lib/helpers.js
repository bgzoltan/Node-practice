export const helpers = {};
import crypto from "crypto";
import { mode } from "../config.js";

helpers.hash = function (str) {
  if (typeof str === "string" && str.length > 0) {
    const hash = crypto
      .createHmac("sha256", mode.hashingSecret)
      .update(str)
      .digest("hex");
    return hash;
  } else return false;
};

helpers.createRandomString = function (strLength) {
  strLength = typeof (strLength === "number") ? strLength : false;
  if (strLength) {
    const possibleCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";
    let randomStr = "";
    for (let i = 0; i < strLength; i++) {
      randomStr =
        randomStr +
        possibleCharacters[
          Math.floor(Math.random() * possibleCharacters.length)
        ];
    }
    return randomStr;
  } else {
    return false;
  }
};

helpers.parseJsonStringToObject = function (str) {
  try {
    const parsedObject = JSON.parse(str);
    return parsedObject;
  } catch {
    return {};
  }
};
