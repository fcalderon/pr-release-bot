const RELEASE_TARGET_BRANCH = 'master'
const NO_RELEASE_LABEL = 'don\'t release'

function getCreateReleaseBody (context, releaseInfo) {
  const { owner, repo } = context.repo()

  return {
    owner,
    repo,
    tag_name: releaseInfo.tag,
    target_commitish: releaseInfo.target || RELEASE_TARGET_BRANCH,
    name: releaseInfo.name,
    body: releaseInfo.body,
    draft: releaseInfo.isDraft,
    prerelease: releaseInfo.isPreRelease
  }
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

    if (payload.pull_request) {
      const pr = payload.pull_request

      let isReleasePR = pr.title.indexOf('release') >= 0
      let targetBranch = pr.base.ref
      let canBeReleased = targetBranch === RELEASE_TARGET_BRANCH && isReleasePR
      let containsNoReleaseLabel = false

      const releaseInfo = {
        name: 'A name',
        body: 'A body',
        tag: 'a-tag',
        target: 'target',
        isDraft: false,
        isPreRelease: false
      }

      const numberOfLabels = pr.labels.length
      for (let i = 0; i < numberOfLabels; i++) {
        if (pr.labels[i].name === NO_RELEASE_LABEL) {
          containsNoReleaseLabel = true
        }
      }

      console.log('Received pull request ', payload.number)
      console.log('Title:', payload.pull_request.title)
      console.log('Is Release PR?:', isReleasePR)
      console.log('Target branch:', targetBranch)
      console.log('Is Allowed to be released?', canBeReleased)
      console.log('Contains no release label?', containsNoReleaseLabel)
      console.log('Release: ', JSON.stringify(getCreateReleaseBody(context, releaseInfo)))


    }

    // const issueComment = context.issue({ body: 'Thanks for opening this issue!' })
    // return context.github.issues.createComment(issueComment)
  })

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
