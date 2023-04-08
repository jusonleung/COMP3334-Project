const swaggerAutogen = require('swagger-autogen')();

const outputFile = './swagger.json';
const endpointsFiles = ['./index.js']; 

swaggerAutogen(outputFile, endpointsFiles);