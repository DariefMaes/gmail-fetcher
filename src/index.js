"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_cron_1 = require("node-cron");
var task = (0, node_cron_1.schedule)("* * * * *", function () {
    console.log("test");
});
task.start();
