import server from "./lib/server.js";
import workers from "./lib/workers.js";

const app = {};

app.init = function () {
  server.init();

  workers.init();
};

app.init();

export default app;
