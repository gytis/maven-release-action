import { getInput, info } from '@actions/core'
import { exec } from '@actions/exec'
import { context } from '@actions/github'

const ACTION_NAME = 'maven-release-action'
const MVN_SET_VERSION_COMMAND = 'mvn org.codehaus.mojo:versions-maven-plugin:2.7:set'
const MVN_COMMIT_VERSION_COMMAND = 'mvn org.codehaus.mojo:versions-maven-plugin:2.7:commit'
const GIT_COMMIT_COMMAND = 'git commit'
const GIT_TAG_COMMAND = 'git tag'
const GIT_PUSH_COMMAND = 'git push'

interface ActionParams {
    remote: string,
    branch: string,
    releaseVersion: string,
    developmentVersion: string,
    tag: string
}

async function initAndGetParams(): Promise<ActionParams> {
    info('Initialising')
    await exec(`git config --local user.email "${ACTION_NAME}"`)
    await exec(`git config --local user.name "${ACTION_NAME}@redhat.com"`)

    return {
        remote: `https://${context.actor}:${getInput('token', { required: true })}@github.com/${context.repo.owner}/${context.repo.repo}.git`,
        branch: getInput('branch', { required: true }),
        releaseVersion: getInput('releaseVersion', { required: true }),
        developmentVersion: getInput('developmentVersion', { required: true }),
        tag: getInput('tag', { required: true })

    } as ActionParams
}

async function setVersion(version: string): Promise<void> {
    info(`Setting a version to ${version}`)
    await exec(MVN_SET_VERSION_COMMAND, [`-DnewVersion=${version}`])
    await exec(MVN_COMMIT_VERSION_COMMAND)
    info('Committing the version change')
    await exec(GIT_COMMIT_COMMAND, ['.', `-m '[${ACTION_NAME}] Set project version to ${version}'`])
}

async function tag(tag: string): Promise<void> {
    info(`Creating a tag ${tag}`)
    await exec(GIT_TAG_COMMAND, [tag])
}

async function push(remote: string, branch: string): Promise<void> {
    info(`Pushing ${branch} to ${remote}`)
    await exec(GIT_PUSH_COMMAND, [remote, branch])
}

async function main(): Promise<void> {
    const params = await initAndGetParams()
    await setVersion(params.releaseVersion)
    await tag(params.tag)
    await setVersion(params.developmentVersion)
    await push(params.remote, params.branch)
    await push(params.remote, params.tag)
}

main()