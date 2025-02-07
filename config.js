let environment = {};

environment.development = {
  port: 3000,
  name: "development",
};

environment.production = {
  port: 50000,
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
