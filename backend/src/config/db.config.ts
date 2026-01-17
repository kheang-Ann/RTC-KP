// import { registerAs } from '@nestjs/config';

// export default registerAs('database', () => {
//   // Build the DATABASE_URL from individual env variables
//   const dbUser = process.env.DB_USER || 'admin';
//   const dbPassword = process.env.DB_PASSWORD || 'admin';
//   const dbHost = process.env.DB_HOST || 'localhost';
//   const dbPort = process.env.DB_CONTAINER_PORT || '5435';
//   const dbName = process.env.DB_NAME || 'rtc_kp_db';

//   return {
//     type: 'postgres' as const,
//     url: `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`,
//   };
// });
