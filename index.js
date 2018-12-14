const { handlePullRequest } = require('./lib/handle-pull-request')

module.exports = app => {
  // Your code here
  app.log('Loaded pr-release-bot')

  app.on('pull_request', async context => handlePullRequest(context))

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
