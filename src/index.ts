import { getInput, setFailed } from '@actions/core'
import { exec } from '@actions/exec'
import { context } from '@actions/github'

const MVN_PREPARE_COMMAND = 'mvn org.apache.maven.plugins:maven-release-plugin:2.5.3:prepare -B -DpushChanges=false'
const GIT_PUSH_ALL_COMMAND = 'git push --all'
const GIT_PUSH_TAGS_COMMAND = 'git push --tags'

class Parameters {
    email: string
    releaseVersion: string
    developmentVersion: string
    profiles: string

    constructor() {
        this.email = getInput('email', { required: true })
        this.releaseVersion = getInput('releaseVersion')
        this.developmentVersion = getInput('developmentVersion')
        this.profiles = getInput('profiles')
    }
}

async function prepare(parameters: Parameters): Promise<void> {
    let commandParams = [];
    if (parameters.releaseVersion.length > 0) {
        commandParams.push(`-DreleaseVersion=${parameters.releaseVersion}`)
    }
    if (parameters.developmentVersion.length > 0) {
        commandParams.push(`-DdevelopmentVersion=${parameters.developmentVersion}`)
    }
    if (parameters.profiles.length > 0) {
        commandParams.push(`-P${parameters.profiles}`)
    }
    await exec(MVN_PREPARE_COMMAND, commandParams)
}

async function push(parameters: Parameters): Promise<void> {
    await exec(`git config --local user.name "${context.actor}"`)
    await exec(`git config --local user.email "${parameters.email}"`)
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

async function main(): Promise<void> {
    try {
        const parameters = new Parameters()
        await prepare(parameters)
        await push(parameters)
    } catch (e) {
        handleFailure(e)
    }
}

main()
