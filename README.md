# Pull Request Release Bot ([pr-release-bot](https://github.com/apps/pr-release-bot))

> A GitHub App built with [Probot](https://github.com/probot/probot) that creates releases based on PR name patterns and PR tags

## Usage

Simple and straight forward bot. Built to satisfy my needs and workflow so it's a bit opinionated. If you use gitflow (or something like it)
then this bot can be useful.

When you create Pull Request against your `releaseTargetBranch`, e.g. `master`, and merge it, this bot will create a release using the body of the pull request as the body of the release.

### How does it work

1. The bot will try to deduce the version (semver) of the release from the pull request's name (e.g. `Release v1.0.0`).
2. If the bot is able to get the version from the pull request name, it's good to go.
3. Once the pull request is merged, the bot will use the deduced version as the tag, as well as the body of the pull request, to create the GitHub release. 

### Available Options

Create a file named `.github/pr-release-bot.yml` with your configuration:

| Name | Type | Description | Default |
|------|------|-------------|---------|
|`releaseTargetBranch`|`string`|The target branch against which releases are made.|`'master'`|
|`labelsToIgnore`|`string[]`|A list of labels which if present on the PR will tell the bot NOT to create a release.|`['pr-release: don't release']`|
|`releaseName`|`string`| The string to use to generate the release name. Use the `{version}` keyword so **pr-release-bot** can insert the version. |`'PR Release Bot Release {version}'`|
|`releaseLabel`|`string`| A label that **pr-release-bot** will add to the pull request indicating that it will be released once merged. |`'pr-release: release {version} :shipit:'`|
|`noReleaseLabel`|`string`| A label that **pr-release-bot** will add to the pull request indicating that it will **NOT** be released once merged. |`'pr-release: won't release'`|


### Plans

Below are a few upcoming features I have in mind for this bot. Feel free to add comments or reactions to the respective issues, or create your own requests. 

* List App in Probot's site (need tests first)
* Add the ability to disable comments ([#11](https://github.com/fcalderon/pr-release-bot/issues/11))
* Add the ability to add a RegEx pattern to determine whether a pull request should be released ([#12](https://github.com/fcalderon/pr-release-bot/issues/12))
* Add the ability to have different detection strategies (e.g. a branch name, regex pattern against branch names or pull request title, pull request label, etc.)([#13](https://github.com/fcalderon/pr-release-bot/issues/13))
* Make the bot smarter by detecting accidental duplicated release versions, or a accidental downgrades (e.g. 1.1.0 -> 1.0.0) ([#14](https://github.com/fcalderon/pr-release-bot/issues/14))
* Block merging the pull request if it should be released but some information is missing (e.g. version name) ([#15](https://github.com/fcalderon/pr-release-bot/issues/15))
* Add colors to labels ([#8](https://github.com/fcalderon/pr-release-bot/issues/8))
* Create a draft of the release when the pull request is created so the user can preview how the release looks
* Add ability to disable the bot all together without un-installing
* Use Pro-Bot's [persistence API](https://probot.github.io/docs/persistence/)


### Tests

Although I am planning on doing so ([#7](https://github.com/fcalderon/pr-release-bot/issues/7)), I haven't added any tests to this yet. Use at your own risk.  

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Contributing

If you have suggestions for how release-bot could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[MIT](LICENSE) © 2018 Francisco Calderon <fjavier5152@gmail.com>
