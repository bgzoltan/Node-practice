import { lib } from "./data.js";
import { helpers } from "./helpers.js";
import { mode } from "../config.js";

let handlers = {};
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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
      const dataToken =
        typeof data.headers.token === "string" ? data.headers.token : "";
      handlers._tokens.verifyToken(dataToken, email, function (isVerified) {
        if (isVerified) {
          lib.read("users", email, function (err, data) {
            if (!err && data) {
              const { password, ...userWithoutCreditentials } = data;
              callback(200, userWithoutCreditentials);
            } else {
              callback(404, { Error: "User is not exist." });
            }
          });
        } else {
          callback(403, {
            Error: "Missing token from headers or invalid token.",
          });
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
    const { query } = data;

    const email =
      typeof query.email === "string" && emailRegex.test(query.email.trim())
        ? query.email
        : "";

    if (!email) {
      callback(400, { Error: "Missing required field." });
    } else {
      lib.delete("users", email, function (err) {
        if (!err) {
          callback(200);
        } else {
          callback(404, { Error: "User is not exist." });
        }
      });
    }
  },
  put: (data, callback) => {
    if (!data.payload) {
      callback(400, { Error: "Missing data." });
    } else {
      const userUpdate = JSON.parse(data.payload);

      const email =
        typeof userUpdate.email === "string" &&
        emailRegex.test(userUpdate.email.trim())
          ? userUpdate.email
          : "";

      const firstName =
        typeof userUpdate.firstName === "string" &&
        userUpdate.firstName.trim().length > 0
          ? userUpdate.firstName
          : "";
      const lastName =
        typeof userUpdate.lastName === "string" &&
        userUpdate.lastName.trim().length > 0
          ? userUpdate.lastName
          : "";
      const phone =
        typeof userUpdate.phone === "string" &&
        userUpdate.phone.trim().length === 7
          ? userUpdate.phone
          : "";

      const password =
        typeof userUpdate.password === "string" &&
        userUpdate.password.trim().length > 0
          ? userUpdate.password
          : "";

      const hashedPassword = helpers.hash(password);

      if (firstName || lastName || phone || password) {
        lib.read("users", email, function (err, user) {
          if (!err && user) {
            // TODO: user can change the password if logged in earlier (token is exists)
            const updatedUser = {
              ...user,
              firstName: firstName ? firstName : user.firstName,
              lastName: lastName ? lastName : user.lastName,
              phone: phone ? phone : user.phone,
              password: password ? hashedPassword : user.password,
            };
            lib.update(
              "users",
              email,
              updatedUser,
              function (err, updatedUserData) {
                if (!err && updatedUserData) {
                  const { password, ...updatedUserDataWOPassword } =
                    updatedUserData;
                  callback(200, updatedUserDataWOPassword);
                } else {
                  console.log(err);
                  callback(400, { Error: "Could not update the user." });
                }
              }
            );
          } else {
            callback(404, { Error: "User is not exist." });
          }
        });
      } else {
        callback(400, { Error: "Missing fields to update." });
      }
    }
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
                callback(200);
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
  put: function (data, callback) {
    if (!data.payload) {
      callback(404, { Error: "Missing data." });
    } else {
      const tokenUpdate = JSON.parse(data.payload);
      const id =
        typeof tokenUpdate.id === "string" &&
        tokenUpdate.id.trim().length === 20
          ? tokenUpdate.id
          : "";

      const extend =
        typeof tokenUpdate.extend === "boolean" && tokenUpdate.extend === true
          ? tokenUpdate.extend
          : false;

      if (id && extend) {
        lib.read("tokens", id, function (err, token) {
          if (!err && token) {
            if (token.expires > Date.now()) {
              const newExpires = Date.now() + 1000 * 60 * 60;
              const updatedToken = { ...token, expires: newExpires };
              lib.update("tokens", id, updatedToken, function (err, newToken) {
                if (!err && newToken) {
                  callback(200);
                } else {
                  callback(500, { Error: "Could not update the token." });
                }
              });
            } else {
              callback(400, {
                Error: "The token is expired and cannot be extended.",
              });
            }
          } else {
            callback(400, { Error: "Token is not exist." });
          }
        });
      } else {
        callback(400, { Error: "Missing field(s) or invalid field(s)." });
      }
    }
  },
  delete: (data, callback) => {
    const { query } = data;

    const id =
      typeof query.id === "string" && query.id.trim().length === 20
        ? query.id
        : "";

    if (!id) {
      callback(400, { Error: "Missing required field." });
    } else {
      lib.delete("tokens", id, function (err) {
        if (!err) {
          callback(200);
        } else {
          callback(404, { Error: "Token is not exist." });
        }
      });
    }
  },
  verifyToken: (tokenId, userEmail, callback) => {
    lib.read("tokens", tokenId, function (err, token) {
      if (!err && token) {
        if (token.email === userEmail && token.expires > Date.now()) {
          callback(true);
        } else {
          callback(false);
        }
      } else {
        callback(false);
      }
    });
  },
};

handlers.checks = (data, callback) => {
  const acceptableMethods = ["post", "get", "delete", "put"];
  if (acceptableMethods.includes(data.method)) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._checks = {
  post: function (data, callback) {
    const payload = JSON.parse(data.payload);
    const protocol =
      typeof payload.protocol === "string" &&
      ["http", "https"].includes(payload.protocol)
        ? payload.protocol
        : "";
    const url =
      typeof payload.url === "string" && payload.url.trim().length > 0
        ? payload.url
        : "";
    const method =
      typeof payload.method === "string" &&
      ["post", "get", "put", "delete"].includes(payload.method)
        ? payload.method
        : "";
    const successCodes =
      typeof payload.successCodes === "object" &&
      payload.successCodes instanceof Array &&
      payload.successCodes.length > 0
        ? payload.successCodes
        : false;
    const timeoutSeconds =
      typeof payload.timeoutSeconds === "number" &&
      payload.timeoutSeconds % 1 === 0 &&
      payload.timeoutSeconds >= 1 &&
      payload.timeoutSeconds <= 5
        ? payload.timeoutSeconds
        : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {
      const token =
        typeof data.headers.token === "string" ? data.headers.token : "";
      if (token) {
        lib.read("tokens", token, function (err, tokenData) {
          if (!err && tokenData) {
            const userEmail = tokenData.email;
            lib.read("users", userEmail, function (err, userData) {
              if (!err && userData) {
                const userChecks =
                  typeof userData.checks === "object" &&
                  userData.checks instanceof Array
                    ? userData.checks
                    : [];
                if (userChecks < mode.maxChecks) {
                  const checkId = helpers.createRandomString(20);
                  const checkObject = {
                    id: checkId,
                    userEmail: userEmail,
                    protocol,
                    url,
                    method,
                    successCodes,
                    timeoutSeconds,
                  };

                  lib.create("checks", checkId, checkObject, function (err) {
                    if (!err) {
                      const updatedUserData = {
                        userData,
                        checks: userChecks.push(checkId),
                      };
                      lib.update(
                        "users",
                        userEmail,
                        updatedUserData,
                        function (err) {
                          if (!err) {
                            callback(200, checkObject);
                          } else {
                            callback(500, {
                              Error: "Could not update the user.",
                            });
                          }
                        }
                      );
                    } else {
                      callback(500, {
                        Error: "Could not create a new check.",
                      });
                    }
                  });
                } else {
                  callback(400, {
                    Error: "The user already has the maximum number of checks.",
                  });
                }
              } else {
                callback(403);
              }
            });
          } else {
            callback(400, { Error: "Token is not exist." });
          }
        });
      } else {
        callback(403);
      }
    } else {
      callback(400, { Error: "Missing required fields or invalid data." });
    }
  },
};

export default handlers;
