import { getInput, info, setFailed } from '@actions/core';
import { exec } from '@actions/exec';
import { context } from '@actions/github';

const params = {
    token: getInput('token'),
    branch: getInput('branch'),
    releaseVersion: getInput('releaseVersion'),
    developmentVersion: getInput('developmentVersion'),
    tag: getInput('tag')
}

function setupGit() {
    info("Starting git setup");
    exec(`git config --local user.email "${context.actor}"`)
    exec(`git config --local user.name "${context.actor}"`)
    exec(`git checkout -B ${params.branch}`)
    // TODO might need to setup a token
    info("Completed git setup");
}

function prepareRelease() {
    info("Starting release preparation");
    const command = `mvn release:prepare -B`;
    command += params.releaseVersion ? ` -DreleaseVersion=${params.releaseVersion}` : '';
    command += params.developmentVersion ? ` -DdevelopmentVersion=${params.developmentVersion}` : '';
    command += params.tag ? ` -DreleaseVersion=${params.tag}` : '';
    exec(command);
    info("Release prepared");
}

function performRelease() {
    info("Starting the release");
    exec('mvn release:perform -B');
    info("Released");
}

try {
    setupGit();
    prepareRelease();
    performRelease();
} catch (error) {
    setFailed(error.message);
}