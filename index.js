const context = require('@actions/github');
const core = require('@actions/core');
const exec = require('@actions/exec');

const params = {
    token: core.getInput('token'),
    branch: core.getInput('branch'),
    releaseVersion: core.getInput('releaseVersion'),
    developmentVersion: core.getInput('developmentVersion'),
    tag: core.getInput('tag')
}

function setupGit() {
    core.info("Starting git setup");
    exec.exec(`git config --local user.email "${context.context.actor}"`)
    exec.exec(`git config --local user.name "${context.context.actor}"`)
    exec.exec(`git checkout -B ${params.branch}`)
    // TODO might need to setup a token
    core.info("Completed git setup");
}

function prepareRelease() {
    core.info("Starting release preparation");
    let command = `mvn release:prepare -B`;
    command += params.releaseVersion ? ` -DreleaseVersion=${params.releaseVersion}` : '';
    command += params.developmentVersion ? ` -DdevelopmentVersion=${params.developmentVersion}` : '';
    command += params.tag ? ` -DreleaseVersion=${params.tag}` : '';
    exec.exec(command);
    core.info("Release prepared");
}

function performRelease() {
    core.info("Starting the release");
    exec.exec('mvn release:perform -B');
    code.info("Released");
}

try {
    setupGit();
    prepareRelease();
    performRelease();
} catch (error) {
    core.setFailed(error.message);
}