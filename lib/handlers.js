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
  get: (data, callback) => {},
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
      lib.create(
        "users",
        user.email,
        JSON.stringify(userObject),
        function (err) {
          if (!err) {
            callback(200);
          } else {
            callback("Cannot create user");
          }
        }
      );
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

export default handlers;
