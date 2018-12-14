/** @namespace context.config */
/** @namespace context.issue */
/** @namespace context.github */
/** @namespace context.github.issues */
/** @namespace context.github.issues.deleteLabel */
/** @namespace context.github.repos */
/** @namespace context.github.repos.createRelease */
/** @namespace context.payload */
/** @namespace context.payload.changes */
/** @namespace context.payload.label */
/** @namespace context.payload.number */
/** @namespace context.payload.pull_request */
/** @namespace context.payload.pull_request.merged */
/** @namespace context.payload.pull_request.labels */
/** @namespace context.payload.pull_request.title */
/** @namespace context.payload.pull_request.body */
/** @namespace context.payload.pull_request.base */
/** @namespace context.payload.pull_request.base.ref */
/** @namespace require */
/** @namespace module */

const {
  CONFIG_FILENAME,
  defaultConfig,
  extractVersionFromString,
  getCreateReleaseBody, getReleaseName,
  isIgnored,
  numberOfIgnoredLabelsFound,
  containsLabel,
  addLabels,
  removeLabel,
  createComment,
  getReleaseLabel,
  updateLabel
} = require('./utils')

function mightBeReleaseable (context, config) {
  if (!context.payload.pull_request) {
    return false
  }

  return context.payload.pull_request.base.ref === config.releaseTargetBranch
}

function isReleaseable (context, config) {
  return mightBeReleaseable(context, config) && !isIgnored(context.payload.pull_request.labels, config)
}

function handlePullRequestOpened (context, config) {
  if (!isReleaseable(context, config)) {
    console.log('Pull request has been opened but not releaseable')
    return
  }

  console.log('Pull request has been opened and releaseable')

  const version = extractVersionFromString(context.payload.pull_request.title)

  if (!version) {
    const issueComment = context.issue({ body: `This PR won't be released because a version couldn't be found.` })
    return context.github.issues.createComment(issueComment)
  } else {
    const releaseLabel = getReleaseLabel(config, version)

    if (!containsLabel(context.payload.pull_request.labels, [releaseLabel])) {
      addLabels(context, config, [releaseLabel])
      const issueComment = context
        .issue({ body: `Excellent. This PR will be released as "${getReleaseName(config, version)}"!` })
      return context.github.issues.createComment(issueComment)
    }
  }
}

function handlePullRequestMerged (context, config) {
  if (!isReleaseable(context, config)) {
    console.log('Pull request merged, but it is not releaseable')
    return
  }

  const version = extractVersionFromString(context.payload.pull_request.title)

  if (version) {
    const releaseInfo = {
      name: getReleaseName(config, version),
      body: context.payload.pull_request.body,
      tag: version,
      target: config.releaseTargetBranch,
      isDraft: false,
      isPreRelease: false
    }
    console.log('Releasing pull request', releaseInfo)
    return context.github.repos.createRelease(getCreateReleaseBody(context, releaseInfo, config))
  } else {
    const issueComment = context.issue({ body: `This PR wasn't released because a version couldn't be found.` })
    return context.github.issues.createComment(issueComment)
  }
}

function handlePullRequestLabelsUpdated (context, config) {
  if (!mightBeReleaseable(context, config)) {
    return
  }

  const version = extractVersionFromString(context.payload.pull_request.title)

  const releaseLabel = getReleaseLabel(config, version)

  if ((context.payload.action === 'labeled' || context.payload.action === 'unlabeled') &&
    config.labelsToIgnore.indexOf(context.payload.label.name) >= 0) {
    // A label was added or removed and it's in the list of labels to ignore
    const labeled = context.payload.action === 'labeled'
    const _numberOfIgnoredLabelsFound = numberOfIgnoredLabelsFound(context.payload.pull_request.labels, config)
    const pr = context.payload.pull_request

    console.log('handlePullRequestLabelsUpdated', {
      labeled,
      _numberOfIgnoredLabelsFound
    })

    console.log('contains label?', containsLabel(context.payload.pull_request.labels, config.noReleaseLabel))
    console.log('contains label?', containsLabel(context.payload.pull_request.labels, releaseLabel))

    if (labeled && _numberOfIgnoredLabelsFound === 1 && !containsLabel(pr.labels, config.noReleaseLabel)) {
      // ignore label was just added, notify user
      removeLabel(context, config, releaseLabel, true)
      addLabels(context, config, [config.noReleaseLabel])

      return createComment(context, `Okay, this PR won't be released.`)
    } else if (_numberOfIgnoredLabelsFound === 0 && !containsLabel(pr.labels, releaseLabel)) {
      removeLabel(context, config, config.noReleaseLabel, true)
      addLabels(context, config, [releaseLabel])

      return createComment(context, `Alright, this PR will be released.`)
    }
  }
}

function handlePullRequestTitleChanges (context, config) {
  const { payload } = context

  if (!isReleaseable(context, config)) {
    return
  }

  const titleChange = {
    from: payload.changes.title.from,
    to: payload.pull_request.title,
    fromVersion: extractVersionFromString(payload.changes.title.from),
    toVersion: extractVersionFromString(payload.pull_request.title)
  }

  console.log('Title changed', titleChange)

  if (titleChange.fromVersion !== titleChange.toVersion) {
    if (titleChange.toVersion) {
      const newReleaseLabel = getReleaseLabel(config, titleChange.toVersion)
      // need to update pr-release tag if it exists
      if (!titleChange.fromVersion) {
        // didn't have version before, now it does
      } else {
        const oldLabel = getReleaseLabel(config, titleChange.fromVersion)

        if (containsLabel(payload.pull_request.labels, oldLabel)) {
          updateLabel(context, config, getReleaseLabel(config, titleChange.fromVersion), { name: newReleaseLabel })
        } else {
          removeLabel(context, config, getReleaseLabel(config, titleChange.fromVersion), true)
          addLabels(context, config, [newReleaseLabel])
        }
        return createComment(context,
          `Release version updated from \`${titleChange.fromVersion}\` to \`${titleChange.toVersion}\``)
      }
    } else if (titleChange.fromVersion) {
      // version was removed, this PR should no longer be merged
      removeLabel(context, config, getReleaseLabel(config, titleChange.fromVersion))
      return createComment(context,
        `Release version \`${titleChange.fromVersion}\` has been removed so this PR won't be released.`)
    }
  }
}

async function handlePullRequest (context) {
  const { payload } = context
  // console.log('pull_request: Got github: ', github)

  const config = Object.assign({}, defaultConfig, (await context.config(CONFIG_FILENAME)) || {})

  // console.log('Config file: ', config)

  // payload actions
  // unlabeled
  // labeled
  // console.log('Payload action', payload.action)
  // console.log('Payload action', payload)
  // console.log('Payload action', payload.action)

  if (payload.pull_request) {
    // const pr = payload.pull_request

    // let isReleasePR = pr.title.indexOf('release') >= 0
    // let targetBranch = pr.base.ref
    // let canBeReleased = targetBranch === config.releaseTargetBranch && isReleasePR
    // let labeledAsIgnored = isIgnored(pr.labels, config)
    // let version = extractVersionFromString(pr.title)

    // const releaseInfo = {
    //   name: getReleaseName(config, version),
    //   body: pr.body,
    //   tag: version,
    //   target: config.releaseTargetBranch,
    //   isDraft: false,
    //   isPreRelease: false
    // }
    //
    // console.log('Received pull request ', payload.number)
    // console.log('Title:', payload.pull_request.title)
    // console.log('Is Release PR?:', isReleasePR)
    // console.log('Target branch:', targetBranch)
    // console.log('Is Allowed to be released?', canBeReleased)
    // console.log('Contains no release label?', labeledAsIgnored)
    // console.log('Release: ', JSON.stringify(getCreateReleaseBody(context, releaseInfo, config)))
    // console.log('Version: ', version)

    switch (payload.action) {
      case 'unlabeled':
      case 'labeled':
        return handlePullRequestLabelsUpdated(context, config)
      case 'edited':
        if (payload.changes && payload.changes.title) {
          return handlePullRequestTitleChanges(context, config)
        }
        break
      case 'closed':
        if (payload.pull_request.merged) {
          // the PR was merged
          return handlePullRequestMerged(context, config)
        }
        break
      case 'opened':
      case 'reopened':
        return handlePullRequestOpened(context, config)
    }
  }
}

module.exports = {
  handlePullRequest
}
