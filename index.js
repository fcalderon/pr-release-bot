const CONFIG_FILE_NAME = 'pr-release-bot.yml'
const SEMVER_REGEX = /\bv?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[\da-z-]+(?:\.[\da-z-]+)*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?\b/ig

const defaultConfig = {
  releaseTargetBranch: 'master',
  commentOnReleasablePR: true,
  labelsToIgnore: ["don't release"]
}

function getCreateReleaseBody (context, releaseInfo, config) {
  const { owner, repo } = context.repo()

  return {
    owner,
    repo,
    tag_name: releaseInfo.tag,
    target_commitish: releaseInfo.target || config.releaseTargetBranch,
    name: releaseInfo.name,
    body: releaseInfo.body,
    draft: releaseInfo.isDraft,
    prerelease: releaseInfo.isPreRelease
  }
}

function isIgnored (prLabels, config) {
  const ignoredLabels = config.labelsToIgnore

  const numberOfLabels = prLabels.length
  for (let i = 0; i < numberOfLabels; i++) {
    if (ignoredLabels.indexOf(prLabels[i].name) >= 0) {
      return true
    }
  }

  return false
}

module.exports = app => {
  // Your code here
  app.log('Yay, the app was loaded!')

  app.on('issues.opened', async context => {
    const issueComment = context.issue({ body: 'Thanks for opening this issue!' })
    return context.github.issues.createComment(issueComment)
  })

  app.on('pull_request', async context => {
    const { github, payload } = context
    // console.log('pull_request: Got github: ', github)

    const config = (await context.config(CONFIG_FILE_NAME)) || defaultConfig
    console.log('Config file: ', config)

    if (payload.pull_request) {
      const pr = payload.pull_request

      let isReleasePR = pr.title.indexOf('release') >= 0
      let targetBranch = pr.base.ref
      let canBeReleased = targetBranch === config.releaseTargetBranch && isReleasePR
      let labeledAsIgnored = isIgnored(pr.labels, config)

      const releaseInfo = {
        name: 'A name',
        body: pr.body,
        tag: 'v0.0.1',
        target: config.releaseTargetBranch,
        isDraft: false,
        isPreRelease: false
      }

      console.log('Payload action', payload.action)
      console.log('Received pull request ', payload.number)
      console.log('Title:', payload.pull_request.title)
      console.log('Is Release PR?:', isReleasePR)
      console.log('Target branch:', targetBranch)
      console.log('Is Allowed to be released?', canBeReleased)
      console.log('Contains no release label?', labeledAsIgnored)
      console.log('Release: ', JSON.stringify(getCreateReleaseBody(context, releaseInfo, config)))
      console.log('Version: ', pr.title.match(SEMVER_REGEX))

      // return context.github.repos.createRelease(getCreateReleaseBody(context, releaseInfo, config))
    }

    // const issueComment = context.issue({ body: 'Thanks for opening this issue!' })
    // return context.github.issues.createComment(issueComment)
  })

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
