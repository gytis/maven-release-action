import { getInput, setFailed } from '@actions/core'
import { exec } from '@actions/exec'

const MVN_PREPARE_COMMAND = 'mvn org.apache.maven.plugins:maven-release-plugin:2.5.3:prepare -B -DpushChanges=false'
const GIT_PUSH_ALL_COMMAND = 'git push --all'
const GIT_PUSH_TAGS_COMMAND = 'git push --tags'

interface Parameters {
    release: string,
    development: string,
    profiles: string
}

async function prepare(parameters: Parameters): Promise<void> {
    let commandParams = [];
    if (parameters.release.length > 0) {
        commandParams.push(`-DreleaseVersion=${parameters.release}`)
    }
    if (parameters.development.length > 0) {
        commandParams.push(`-DdevelopmentVersion=${parameters.development}`)
    }
    if (parameters.profiles.length > 0) {
        commandParams.push(`-P${parameters.profiles}`)
    }
    await exec(MVN_PREPARE_COMMAND, commandParams)
}

async function push(): Promise<void> {
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
        await prepare({
            release: getInput('releaseVersion'),
            development: getInput('developmentVersion'),
            profiles: getInput('profiles')
        })
        await push()
    } catch (e) {
        handleFailure(e)
    }
}

main()
