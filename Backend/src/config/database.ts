import { Sequelize } from 'sequelize';
import { env } from './env';

export const sequelize = new Sequelize(
  env.db.name,
  env.db.user,
  env.db.password,
  {
    host: env.db.host,
    port: env.db.port,
    dialect: 'mysql',
    logging: env.nodeEnv === 'development' ? console.log : false,
  }
);

export async function testDatabaseConnection(): Promise<void> {
  await sequelize.authenticate();
}

export async function syncDatabase(): Promise<void> {
  await sequelize.sync({
    force: false,
  });
}
