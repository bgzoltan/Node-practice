let environment = {};

environment.development = {
  httpPort: 3000,
  httpsPort: 3001,
  name: "development",
};

environment.production = {
  httpPort: 50000,
  httpsPort: 50001,
  name: "production",
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
