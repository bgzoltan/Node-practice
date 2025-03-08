export const helpers = {};
import crypto from "crypto";
import { mode } from "../config.js";
import querystring from "querystring";
import { Buffer } from "buffer";
import https from "https";

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

helpers.sendTwilioSms = function (phone, text, callback) {
  // Need to register a twilio account and use accountSid and token to authenticate into the service
  const toPhone = typeof phone === "string" ? phone.trim() : "";
  const textMessage =
    typeof text === "string" &&
    text.trim().length > 0 &&
    text.trim().length < 1600
      ? text.trim()
      : "";

  if (toPhone && textMessage) {
    const payload = {
      From: mode.twilio.fromPhone,
      // I can send messages to phone numbers verified in twilio account
      To: "+61" + phone,
      Body: textMessage,
    };

    const stringPayload = querystring.stringify(payload);
    const requestDetails = {
      protocol: "https:",
      hostname: "api.twilio.com",
      method: "POST",
      path: "/2010-04-01/Accounts/" + mode.twilio.accountSid + "/Messages.json",
      auth: mode.twilio.accountSid + ":" + mode.twilio.token,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(stringPayload),
      },
    };

    const req = https.request(requestDetails, function (res) {
      const status = res.statusCode;
      if (status === 200 || status === 201) {
        callback(false);
      } else {
        callback("Status code returned:" + status);
      }
    });

    req.on("error", function (err) {
      callback(err);
    });

    req.write(stringPayload);

    req.end();
  } else {
    callback("Missing or invalid parameters.");
  }
};
