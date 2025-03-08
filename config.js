import dotenv from "dotenv";
dotenv.config();

let environment = {};

environment.development = {
  httpPort: 3000,
  httpsPort: 3001,
  name: "development",
  hashingSecret: process.env.PW_SECRET,
  maxChecks: 5,
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    token: process.env.TWILIO_TOKEN,
    fromPhone: process.env.TWILIO_FROM_PHONE,
  },
};

environment.production = {
  httpPort: 50000,
  httpsPort: 50001,
  name: "production",
  hashingSecret: process.env.PW_SECRET,
  maxChecks: 5,
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    token: process.env.TWILIO_TOKEN,
    fromPhone: process.env.TWILIO_FROM_PHONE,
  },
};

let selectedMode =
  typeof process.env.NODE_ENV === "string" ? process.env.NODE_ENV : "";

if (!selectedMode) {
  selectedMode = "development";
}

export const mode =
  typeof environment[selectedMode] !== undefined
    ? environment[selectedMode]
    : environment.development;
