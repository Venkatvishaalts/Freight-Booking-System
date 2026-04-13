// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  projectId: 'scchmg',
  e2e: {
    baseUrl: 'http://localhost:3000', // your React app URL
    setupNodeEvents(on, config) {},
  },
});