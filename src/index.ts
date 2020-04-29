import { getInput, info, setFailed } from '@actions/core'
import { exec } from '@actions/exec'
import { ExecOptions } from '@actions/exec/lib/interfaces'
import { context } from '@actions/github'

const ACTION_NAME = 'maven-release-action'
const MVN_GET_VERSION_COMMAND = 'mvn org.apache.maven.plugins:maven-help-plugin:3.2.0:evaluate -Dexpression=project.version -q -DforceStdout'
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

async function getProjectVersion(): Promise<string> {
    let output = ''
    let errors = ''
    const options: ExecOptions = {
        listeners: {
            stdout: (data: Buffer) => output += data.toString(),
            stderr: (data: Buffer) => errors += data.toString()
        }
    }
    await exec(MVN_GET_VERSION_COMMAND, undefined, options)
    if (errors.length > 0) {
        throw new Error(errors)
    }
    return output
}

async function getReleaseVersion(): Promise<string> {
    if (getInput('releaseVersion') === null) {
        return (await getProjectVersion()).replace('-SNAPSHOT', '')
    }

    return getInput('releaseVersion')
}

async function getDevelopmentVersion(releaseVersion: string): Promise<string> {
    if (getInput('developmentVersion') === null) {
        let parts = releaseVersion.split('.')
        let lastNumber: number = parseInt(parts[parts.length - 1])
        if (isNaN(lastNumber)) {
            throw new Error(`Unsupported format of ${releaseVersion}`)
        }
        parts[parts.length - 1] = (++lastNumber).toString()
        return parts.join('.')
    }
    return getInput('developmentVersion')
}

async function getTag(releaseVersion: string): Promise<string> {
    if (getInput('tag') === null) {
        return releaseVersion
    }
    return getInput('tag')
}

async function initAndGetParams(): Promise<ActionParams> {
    info('Initialising')

    const token = getInput('token', { required: true })
    const remote = `https://${context.actor}:${token}@github.com/${context.repo.owner}/${context.repo.repo}.git`
    const branch = getInput('branch', { required: true })
    const releaseVersion: string = await getReleaseVersion()
    const developmentVersion: string = await getDevelopmentVersion(releaseVersion)
    const tag: string = await getTag(releaseVersion)

    await exec(`git config --local user.email "${ACTION_NAME}"`)
    await exec(`git config --local user.name "${ACTION_NAME}@redhat.com"`)

    return {
        remote: remote,
        branch: branch,
        releaseVersion: releaseVersion,
        developmentVersion: developmentVersion,
        tag: tag
    } as ActionParams
}

async function setVersion(version: string): Promise<void> {
    info(`Setting a version to ${version}`)
    await exec(MVN_SET_VERSION_COMMAND, [`-DnewVersion=${version}`])
    await exec(MVN_COMMIT_VERSION_COMMAND)
    info('Committing the version change')
    await exec(GIT_COMMIT_COMMAND, ['.', '-m', `[${ACTION_NAME}] Set project version to ${version}`])
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
    try {
        const params = await initAndGetParams()
        await setVersion(params.releaseVersion)
        await tag(params.tag)
        await setVersion(params.developmentVersion)
        await push(params.remote, params.branch)
        await push(params.remote, params.tag)
    } catch (e) {
        console.error(e)
        if (e instanceof Error) {
            setFailed(e.message)
        } else {
            setFailed('Failed to release project')
        }
    }
}

main()
