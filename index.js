const github = require('@actions/github');
const core = require('@actions/core');
const exec = require('@actions/exec');

const params = {
    token: core.getInput('token'),
    branch: core.getInput('branch'),
    releaseVersion: core.getInput('releaseVersion'),
    developmentVersion: core.getInput('developmentVersion'),
    tag: core.getInput('tag')
}

async function setupGit() {
    core.info("Starting git setup");
    await exec.exec(`git config --local user.email "gytis@redhat.com"`);
    await exec.exec(`git config --local user.name "gytis"`);
    core.info(context.context.actor);
    core.info(params.token);
    core.info(context.context.repo.owner);
    core.info(context.context.repo.repo);
    await exec.exec(`git remote set-url origin https://gytis:${params.token}@github.com/gytis/release-action-test.git`);
    await exec.exec(`git checkout ${params.branch}`);
    // TODO might need to setup a token
    core.info("Completed git setup");
}

async function prepareRelease() {
    core.info("Starting release preparation");
    let command = `mvn release:prepare -B -Dusername=${github.context.actor} -Dpassword=${params.token}`;
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

setupGit()
    .then(() => prepareRelease())
    .then(() => performRelease())
    .catch(reason => core.setFailed(reason));