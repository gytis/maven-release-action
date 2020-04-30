import { getInput, info, setFailed } from '@actions/core'
import { exec } from '@actions/exec'
import { context } from '@actions/github'

const MVN_RELEASE_PREPARE_COMMAND = 'mvn org.apache.maven.plugins:maven-release-plugin:2.5.3:prepare -B -DpushChanges=false'
const MVN_RELEASE_PERFORM_COMMAND = 'mvn org.apache.maven.plugins:maven-release-plugin:2.5.3:perform -B'
const MVN_RELEASE_CLEAN_COMMAND = 'mvn org.apache.maven.plugins:maven-release-plugin:2.5.3:clean -B'
const GIT_PUSH_ALL_COMMAND = 'git push --all'
const GIT_PUSH_TAGS_COMMAND = 'git push --tags'

const PROPERTIES = {
    user: context.actor,
    email: getInput('email', { required: true }),
    releaseVersion: getInput('releaseVersion'),
    developmentVersion: getInput('developmentVersion'),
    tag: getInput('tag'),
    profiles: getInput('profiles'),
    doNotDeploy: getInput('doNotDeploy').toLowerCase() === 'true'
}

async function init(): Promise<void> {
    info('setting user name and email in a local git configuration')
    await exec(`git config --local user.name "${PROPERTIES.user}"`)
    await exec(`git config --local user.email "${PROPERTIES.email}"`)
}

async function prepare(): Promise<void> {
    let params = [];
    if (PROPERTIES.releaseVersion.length > 0) {
        params.push(`-DreleaseVersion=${PROPERTIES.releaseVersion}`)
    }
    if (PROPERTIES.developmentVersion.length > 0) {
        params.push(`-DdevelopmentVersion=${PROPERTIES.developmentVersion}`)
    }
    if (PROPERTIES.tag.length > 0) {
        params.push(`-Dtag=${PROPERTIES.tag}`)
    }
    if (PROPERTIES.profiles.length > 0) {
        params.push(`-P${PROPERTIES.profiles}`)
    }
    info('tagging the project')
    await exec(MVN_RELEASE_PREPARE_COMMAND, params)
}

async function perform(): Promise<void> {
    if (PROPERTIES.doNotDeploy) {
        return
    }
    let params = [];
    if (PROPERTIES.profiles.length > 0) {
        params.push(`-P${PROPERTIES.profiles}`)
    }
    info('deploying the project')
    await exec(MVN_RELEASE_PERFORM_COMMAND, params)
}

async function cleanup(): Promise<void> {
    info('cleaning up')
    await exec(MVN_RELEASE_CLEAN_COMMAND)
}

async function push(): Promise<void> {
    info('pushing the changes')
    await exec(GIT_PUSH_ALL_COMMAND)
    await exec(GIT_PUSH_TAGS_COMMAND)
}

function handleFailure(e: any) {
    console.error(e)
    if (e instanceof Error) {
        setFailed(e.message)
    } else {
        setFailed('Failed to release project')
    }
}

async function execute(): Promise<void> {
    try {
        await init()
        await prepare()
        await push()
        await perform()
    } catch (e) {
        handleFailure(e)
    } finally {
        await cleanup()
    }
}

execute()
