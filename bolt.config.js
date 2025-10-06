export default {
  type: 'fullstack',
  framework: 'express',
  server: {
    entry: 'server.js',
    port: process.env.PORT || 3000,
    start: 'node server.js'
  },
  build: {
    command: 'npm run build',
    outputDir: 'dist'
  },
  api: {
    routes: '/api/*'
  },
  static: {
    dir: 'dist'
  }
};