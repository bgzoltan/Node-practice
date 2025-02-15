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

export default handlers;
