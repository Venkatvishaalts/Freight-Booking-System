require('dotenv').config();

console.log('í·ª Backend Test\n');

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);

console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

console.log('\nâœ… ENV LOADED SUCCESSFULLY');
