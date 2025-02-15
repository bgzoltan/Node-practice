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
