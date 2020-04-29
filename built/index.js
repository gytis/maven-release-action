"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const github_1 = require("@actions/github");
const exec_1 = require("@actions/exec");
const ACTION_NAME = 'maven-release-action';
const MVN_SET_VERSION_COMMAND = 'mvn org.codehaus.mojo:versions-maven-plugin:2.7:set';
const MVN_COMMIT_VERSION_COMMAND = 'mvn org.codehaus.mojo:versions-maven-plugin:2.7:commit';
const GIT_COMMIT_COMMAND = 'git commit';
const GIT_TAG_COMMAND = 'git tag';
const GIT_PUSH_COMMAND = 'git push';
function initAndGetParams() {
    return __awaiter(this, void 0, void 0, function* () {
        core_1.info('Initialising');
        yield exec_1.exec(`git config --local user.email "${ACTION_NAME}"`);
        yield exec_1.exec(`git config --local user.name "${ACTION_NAME}@redhat.com"`);
        return {
            remote: `https://${github_1.context.actor}:${core_1.getInput('token')}@github.com/${github_1.context.repo.owner}/${github_1.context.repo.repo}.git`,
            branch: core_1.getInput('branch'),
            releaseVersion: core_1.getInput('releaseVersion'),
            developmentVersion: core_1.getInput('developmentVersion'),
            tag: core_1.getInput('tag')
        };
    });
}
function setVersion(version) {
    return __awaiter(this, void 0, void 0, function* () {
        core_1.info(`Setting a version to ${version}`);
        yield exec_1.exec(MVN_SET_VERSION_COMMAND, [`-DnewVersion=${version}`]);
        yield exec_1.exec(MVN_COMMIT_VERSION_COMMAND);
        core_1.info('Committing the version change');
        yield exec_1.exec(GIT_COMMIT_COMMAND, ['.', `-m '[${ACTION_NAME}] Set project version to ${version}'`]);
    });
}
function tag(tag) {
    return __awaiter(this, void 0, void 0, function* () {
        core_1.info(`Creating a tag ${tag}`);
        yield exec_1.exec(GIT_TAG_COMMAND, [tag]);
    });
}
function push(remote, branch) {
    return __awaiter(this, void 0, void 0, function* () {
        core_1.info(`Pushing ${branch} to ${remote}`);
        yield exec_1.exec(GIT_PUSH_COMMAND, [remote, branch]);
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const params = yield initAndGetParams();
        yield setVersion(params.releaseVersion);
        yield tag(params.tag);
        yield setVersion(params.developmentVersion);
        yield push(params.remote, params.branch);
        yield push(params.remote, params.tag);
    });
}
main();
