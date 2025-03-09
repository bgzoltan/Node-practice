import http from "http";
import https from "https";
import url from "url";
import { StringDecoder } from "string_decoder";
import { mode } from "../config.js";
import fs from "fs";
import { lib as _data } from "./data.js";
import handlers from "./handlers.js";
import { helpers } from "./helpers.js";
import path from "path";
import { fileURLToPath } from "url";

// Define __filename and __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let server = {};

// Testing
// @TODO remove it later

// helpers.sendTwilioSms(
//   "478699077",
//   "Dangerous weather is coming soon...",
//   function (err) {
//     console.log("SMS error", err);
//   }
// );

// _data.create("test", "newFile", { name: "Zoli" }, function (err) {
//   console.log("This error", err);
// });

// _data.read("test", "newFile1", function (err, data) {
//   if (err) {
//     console.log("Error:", err);
//   } else {
//     console.log("Data:", data);
//   }
// });

// _data.update("test", "newFile", { name: "Gabi" }, function (err) {
//   if (err) {
//     console.log("Error:", err);
//   } else {
//     console.log("Success");
//   }
// });

// _data.delete("test", "newFile", function (err) {
//   if (err) {
//     console.log("Error:", err);
//   } else {
//     console.log("File is deleted.");
//   }
// });

server.httpServer = http.createServer(function (req, res) {
  server.unifiedServer(req, res);
});

server.httpsParams = {
  cert: fs.readFileSync(path.join(__dirname, "/../https/cert.pem")),
  key: fs.readFileSync(path.join(__dirname, "/../https/key.pem")),
};

server.httpsServer = https.createServer(
  server.httpsParams,
  function (req, res) {
    server(req, res);
  }
);

server.unifiedServer = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathName = parsedUrl.pathname;
  const query = parsedUrl.query;
  const method = req.method.toLowerCase();

  const trimmedPath = pathName.split("/").join("");
  const decoder = new StringDecoder("utf-8");

  let buffer = "";
  req.on("data", (data) => {
    buffer += decoder.write(data);
  });

  req.on("end", () => {
    buffer += decoder.end();
    const headers = { ...req.headers, "Content-Type": "application/json" };
    const data = {
      pathName,
      method,
      query,
      headers,
      payload: buffer,
    };

    const selectedHandler =
      typeof server.routing[trimmedPath] !== undefined
        ? server.routing[trimmedPath]
        : false;

    const handlerCallback = (statusCode, payload) => {
      const status = typeof statusCode === "number" ? statusCode : 200;
      payload = typeof payload === "object" ? payload : {};
      const payloadString = JSON.stringify(payload);
      res.writeHead(status, headers);
      res.end(payloadString);
    };

    if (!selectedHandler) {
      res.writeHead(404);
      res.end("Error: Not found");
    } else {
      selectedHandler(data, handlerCallback);
    }
  });
};

server.routing = {
  hello: handlers.hello,
  write: handlers.write,
  ping: handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks,
};

server.init = function () {
  server.httpServer.listen(mode.httpPort, function () {
    console.log(`Server is listening on port: ${mode.httpPort}`);
  });

  server.httpsServer.listen(mode.httpsPort, function () {
    console.log(`Server is listening on port: ${mode.httpsPort}`);
  });
};

export default server;
