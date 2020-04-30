# What is this?

This is a GitHub action to automate Maven project's tagging and deploying (optional). It uses [maven-release-plugin](https://maven.apache.org/maven-release/maven-release-plugin) so you can configure various defaults such as tag name and versions in your `pom.xml`. However, the basic overrides are available through the action inputs so the plugin definition in the `pom.xml` is not necessary.

# How to use the action

## Minimal configuration

```yaml
# ...
- name: Release
  uses: gytis/maven-release-action@master
  with:
    email: your-name@example.com
# ...
```

## Optional properties

| Name | Description | Default value |
| ---- | ----------- | ------------- |
| profiles | Maven profiles that should be activates e.g. release | - |
| releaseVersion | Release version that should be used | Delegate to the release plugin |
| developmentVersion | Next development version that should be used | Delegate to the release plugin |
| tag | Tag name that should be used | Delegate to the release plugin |
| doNotDeploy | Whether the deploy step should be skipped i.e. only tag the project | false |

## Example. Release on push to master

```yaml
name: Release
on:
  push:
    branches: [ master ]
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Maven
        uses: actions/setup-java@v1
        with:
          java-version: 11
          server-id: my-server-id
          server-username: MAVEN_USERNAME
          server-password: MAVEN_PASSWORD
      - name: Release
        uses: gytis/maven-release-action@master
        with:
          email: your-name@example.com
        env:
          MAVEN_USERNAME: ${{secrets.MAVEN_USERNAME}}
          MAVEN_PASSWORD: ${{secrets.MAVEN_PASSWORD}}
```

# Build the action

```bash
npm run all
```