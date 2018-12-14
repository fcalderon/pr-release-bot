/**
 * The default filename of the configuration file
 * @type {string}
 */
const CONFIG_FILENAME = 'pr-release-bot.yml'

/**
 * Regular expression to get the semantic version
 * @type {RegExp}
 */
const SEMVER_REGEX = /\bv?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[\da-z-]+(?:\.[\da-z-]+)*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?\b/ig

const defaultConfig = {
  releaseTargetBranch: 'master',
  commentOnReleasablePR: true,
  labelsToIgnore: ["pr-release: don't release"],
  releaseName: 'PR Release Bot Release {version}',
  releaseLabel: 'pr-release: will release {version} :shipit:',
  noReleaseLabel: 'pr-release: won\'t release'
}

/**
 * Returns the necessary body for creating a release on github
 * @param context
 * @param releaseInfo
 * @param config
 * @returns {{owner, tag_name: (string|string|number), prerelease: boolean, repo, target_commitish: string | Element | EventTarget | Node | SVGAnimatedString | HTMLElement | *, draft: boolean, name: *, body: *}}
 */
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

/**
 * Determines whether the PR contains a label that is marked as to be ignored
 * @param prLabels the labels in the pull request, typically context.payload.pull_request.labels
 * @param config the app config
 * @returns {boolean} whether it contains a label that is marked as to be ignored
 */
function isIgnored (prLabels, config) {
  const numberOfLabels = prLabels.length
  for (let i = 0; i < numberOfLabels; i++) {
    if (config.labelsToIgnore.indexOf(prLabels[i].name) >= 0) {
      return true
    }
  }

  return false
}

function numberOfIgnoredLabelsFound (prLabels, config) {
  let numberOfLabelsFound = 0

  const numberOfLabels = prLabels.length
  for (let i = 0; i < numberOfLabels; i++) {
    if (config.labelsToIgnore.indexOf(prLabels[i].name) >= 0) {
      numberOfLabelsFound++
    }
  }

  return numberOfLabelsFound
}

/**
 * Extracts and returns the semantic version from the given string
 * @param source
 * @returns the semantic version or null
 */
function extractVersionFromString (source) {
  let version = source.match(SEMVER_REGEX)

  return !version || version.length === 0 ? null : version[0]
}

/**
 * Returns the release name based on the configuration
 *
 * @param config
 * @param version
 * @returns string
 */
function getReleaseName (config, version) {
  return config.releaseName.replace('{version}', version)
}

function containsLabel (prLabels, labelName) {
  return prLabels.map(prLabel => prLabel.name).indexOf(labelName) >= 0
}

function removeLabel (context, config, labelToRemove, andDelete = false) {
  if (containsLabel(context.payload.pull_request.labels, labelToRemove)) {
    if (andDelete) {
      return context.github.issues.removeLabel(context.issue({
        name: labelToRemove
      })) && context.github.issues.deleteLabel(context.issue({
        name: labelToRemove
      }))
    } else {
      return context.github.issues.removeLabel(context.issue({
        name: labelToRemove
      }))
    }
  }
}

function addLabels (context, config, labelNames) {
  const labelsToAdd = []

  labelNames.forEach(labelName => {
    if (!containsLabel(context.payload.pull_request.labels, labelName)) {
      labelsToAdd.push(labelName)
    }
  })

  if (labelsToAdd.length > 0) {
    return context.github.issues.addLabels(context.issue({ labels: labelsToAdd }))
  }
}

function updateLabel (context, config, labelName, update) {
  return context.github.issues
    .updateLabel(context.issue({ current_name: labelName, ...update }))
}

function createComment (context, body) {
  const issueComment = context.issue({ body })
  return context.github.issues.createComment(issueComment)
}

function getReleaseLabel (config, version) {
  return config.releaseLabel.replace('{version}', (version ? ` (${version})` : ''))
}

// noinspection JSUnresolvedVariable
module.exports = {
  CONFIG_FILENAME,
  SEMVER_REGEX,
  defaultConfig,
  getCreateReleaseBody,
  isIgnored,
  extractVersionFromString,
  getReleaseName,
  numberOfIgnoredLabelsFound,
  containsLabel,
  addLabels,
  removeLabel,
  createComment,
  getReleaseLabel,
  updateLabel
}
