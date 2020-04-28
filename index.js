const github = require('@actions/github');
const core = require('@actions/core');
const exec = require('@actions/exec');

function initParams() {
    return {
        token: core.getInput('token'),
        branch: core.getInput('branch'),
        releaseVersion: core.getInput('releaseVersion'),
        developmentVersion: core.getInput('developmentVersion'),
        tag: core.getInput('tag'),
        user: github.context.actor,
        email: 'gytis@redhat.com',
        owner: github.context.repo.owner,
        repo: github.context.repo.repo
    }
}

async function setupGit(params) {
    core.info("Starting git setup");
    await exec.exec(`git config --local user.email "${params.email}"`);
    await exec.exec(`git config --local user.name "${params.user}"`);
    exec.exec(`git remote set-url origin https://${params.user}:${params.token}@github.com/${params.owner}/${params.repo}.git`);
    exec.exec(`git checkout ${params.branch}`);
    // TODO might need to setup a token
    core.info("Completed git setup");
}

async function prepareRelease(params) {
    core.info("Starting release preparation");
    let command = `mvn release:prepare -B`;
    command += params.releaseVersion ? ` -DreleaseVersion=${params.releaseVersion}` : '';
    command += params.developmentVersion ? ` -DdevelopmentVersion=${params.developmentVersion}` : '';
    command += params.tag ? ` -DreleaseVersion=${params.tag}` : '';
    await exec.exec(command);
    core.info("Release prepared");
}

async function performRelease() {
    core.info("Starting the release");
    await exec.exec('mvn release:perform -B');
    core.info("Released");
}

try {
    const params = initParams();
    setupGit(params)
        .then(() => prepareRelease(params))
        .then(() => performRelease())
        .catch(reason => core.setFailed(reason));
} catch (e) {
    core.setFailed(e.message);
}