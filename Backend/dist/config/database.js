"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
exports.testDatabaseConnection = testDatabaseConnection;
exports.syncDatabase = syncDatabase;
const sequelize_1 = require("sequelize");
const env_1 = require("./env");
exports.sequelize = new sequelize_1.Sequelize(env_1.env.db.name, env_1.env.db.user, env_1.env.db.password, {
    host: env_1.env.db.host,
    port: env_1.env.db.port,
    dialect: 'mysql',
    logging: env_1.env.nodeEnv === 'development' ? console.log : false,
});
async function testDatabaseConnection() {
    await exports.sequelize.authenticate();
}
async function syncDatabase() {
    await exports.sequelize.sync({
        force: false,
    });
}
//# sourceMappingURL=database.js.map