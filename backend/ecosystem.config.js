module.exports = {
  apps : [{
    name: "peoplix-api",
    script: "./index.js",
    env: {
      NODE_ENV: "production",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
}