import { getInput, setFailed, info } from '@actions/core'
import { exec } from '@actions/exec'
import { context } from '@actions/github'

const MVN_PREPARE_COMMAND = 'mvn org.apache.maven.plugins:maven-release-plugin:2.5.3:prepare -B -DpushChanges=false'
const GIT_PUSH_ALL_COMMAND = 'git push --all'
const GIT_PUSH_TAGS_COMMAND = 'git push --tags'

class Action {
    user: string
    email: string
    releaseVersion: string
    developmentVersion: string
    profiles: string

    constructor() {
        this.user = context.actor
        this.email = getInput('email', { required: true })
        this.releaseVersion = getInput('releaseVersion')
        this.developmentVersion = getInput('developmentVersion')
        this.profiles = getInput('profiles')
    }

    public async execute(): Promise<void> {
        try {
            await this.init()
            await this.prepare()
            await this.push()
        } catch (e) {
            this.handleFailure(e)
        }
    }

    async init(): Promise<void> {
        info('setting user name and email in a local git configuration')
        await exec(`git config --local user.name "${this.user}"`)
        await exec(`git config --local user.email "${this.email}"`)
    }

    async prepare(): Promise<void> {
        let params = [];
        if (this.releaseVersion.length > 0) {
            params.push(`-DreleaseVersion=${this.releaseVersion}`)
        }
        if (this.developmentVersion.length > 0) {
            params.push(`-DdevelopmentVersion=${this.developmentVersion}`)
        }
        if (this.profiles.length > 0) {
            params.push(`-P${this.profiles}`)
        }
        info('tagging the project')
        await exec(MVN_PREPARE_COMMAND, params)
    }

    async push(): Promise<void> {
        info('pushing the changes')
        await exec(GIT_PUSH_ALL_COMMAND)
        await exec(GIT_PUSH_TAGS_COMMAND)
    }

    handleFailure(e: any) {
        console.error(e)
        if (e instanceof Error) {
            setFailed(e.message)
        } else {
            setFailed('Failed to release project')
        }
    }
}

new Action().execute()
