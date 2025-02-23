import { lib } from "./data.js";
import { helpers } from "./helpers.js";

let handlers = {};

handlers.hello = (data, callback) => {
  callback(406, { data: data.payload });
};

handlers.write = (data, callback) => {
  callback(200, { data: data.payload });
};

handlers.ping = (data, callback) => {
  callback(200);
};
handlers.users = (data, callback) => {
  const acceptableMethods = ["post", "get", "delete", "put"];
  if (acceptableMethods.includes(data.method)) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._users = {
  get: (data, callback) => {
    const { query } = data;
    const email = typeof query.email === "string" ? query.email : "";
    if (!email) {
      callback(400, { Error: "Missing required field." });
    } else {
      lib.read("users", email, function (err, data) {
        if (!err && data) {
          const { password, ...userWithoutCreditentials } = data;
          callback(200, userWithoutCreditentials);
        } else {
          callback(404, { Error: "User is not in the database." });
        }
      });
    }
  },
  post: (data, callback) => {
    const user = JSON.parse(data.payload);
    const firstName =
      typeof user.firstName === "string" && user.firstName.trim().length > 0
        ? user.firstName
        : "";
    const lastName =
      typeof user.lastName === "string" && user.lastName.trim().length > 0
        ? user.lastName
        : "";
    const phone =
      typeof user.phone === "string" && user.phone.trim().length === 7
        ? user.phone
        : "";
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    let email = "";
    if (emailRegex.test(user.email.trim())) {
      email = user.email;
    }
    const password =
      typeof user.password === "string" && user.password.trim().length > 0
        ? user.password
        : "";
    const hashedPassword = helpers.hash(password);

    const tosAgreement =
      typeof user.tosAgreement === "boolean" && user.tosAgreement
        ? true
        : false;

    const userObject = {
      firstName,
      lastName,
      phone,
      email,
      password: hashedPassword,
      tosAgreement,
    };

    if (firstName && lastName && phone && email && password && tosAgreement) {
      lib.create("users", user.email, userObject, function (err) {
        if (!err) {
          callback(200);
        } else {
          callback("Cannot create user");
        }
      });
    } else {
      callback(400, { Error: "Missing required fields." });
    }
  },
  delete: (data, callback) => {
    console.log("DELETE");
  },
  put: (data, callback) => {
    console.log("PUT");
  },
};

handlers.tokens = (data, callback) => {
  const acceptableMethods = ["post", "get", "delete", "put"];
  if (acceptableMethods.includes(data.method)) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._tokens = {
  post: function (data, callback) {
    const creditentials = JSON.parse(data.payload);

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    let email = "";
    if (emailRegex.test(creditentials.email.trim())) {
      email = creditentials.email;
    }
    const password =
      typeof creditentials.password === "string" &&
      creditentials.password.trim().length > 0
        ? creditentials.password
        : "";

    if (email && password) {
      lib.read("users", email, function (err, userData) {
        if (!err && data) {
          const hashedPassword = helpers.hash(password);

          if (hashedPassword === userData.password) {
            const id = helpers.createRandomString(20);
            const expires = Date.now() + 1000 * 60 * 60;
            const tokenObject = {
              email,
              id,
              expires,
            };
            lib.create("tokens", id, tokenObject, function (err) {
              if (!err) {
                callback(200, tokenObject);
              } else {
                callback(500, { Error: "Could not create a new token." });
              }
            });
          } else {
            callback(400, {
              Error: "User or password is not specified correctly!",
            });
          }
        } else {
          callback(400, {
            Error: "User or password is not specified correctly!",
          });
        }
      });
    } else {
      callback(400, { Error: "Missing rquired fields." });
    }
  },
  get: (data, callback) => {
    const { query } = data;
    const id =
      typeof query.id === "string" && query.id.trim().length === 20
        ? query.id
        : "";
    if (!query.id) {
      callback(400, { Error: "Missing required field." });
    } else {
      lib.read("tokens", id, function (err, data) {
        if (!err && data) {
          callback(200, data);
        } else {
          callback(404, { Error: "Token is not exist." });
        }
      });
    }
  },
  put: function (data, callback) {},
  delete: function (data, callback) {},
};

export default handlers;
