const {parse} = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const github = require('@actions/github');
const _ = require('lodash');
const CONST = require('../../../libs/CONST');
const GithubUtils = require('../../../libs/GithubUtils');

const items = [
    "I verified that similar component doesn't exist in the codebase",
    'I verified that all props are defined accurately and each prop has a `/** comment above it */`',
    'I verified that each file is named correctly',
    'I verified that each component has a clear name that is non-ambiguous and the purpose of the component can be inferred from the name alone',
    'I verified that the only data being stored in component state is data necessary for rendering and nothing else',
    "In component if we are not using the full Onyx data that we loaded, I've added the proper selector in order to ensure the component only re-renders when the data it is using changes",
    'For Class Components, any internal methods passed to components event handlers are bound to `this` properly so there are no scoping issues (i.e. for `onClick={this.submit}` the method `this.submit` should be bound to `this` in the constructor)',
    'I verified that component internal methods bound to `this` are necessary to be bound (i.e. avoid `this.submit = this.submit.bind(this);` if `this.submit` is never passed to a component event handler like `onClick`)',
    'I verified that all JSX used for rendering exists in the render method',
    'I verified that each component has the minimum amount of code necessary for its purpose, and it is broken down into smaller components in order to separate concerns and functions',
];

function detectReactComponent(code, filename) {
    if (!code) {
        console.error('failed to get code from a filename', code, filename);
        return;
    }
    const ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx'], // enable jsx plugin
    });

    let isReactComponent = false;

    traverse(ast, {
        FunctionDeclaration(path) {
            if (isReactComponent) {
                return;
            }
            if (path.node.id && _.some(path.node.body.body, (node) => node.type === 'ReturnStatement' && node.argument.type === 'JSXElement')) {
                console.log('Detected react component in file', filename);
                isReactComponent = true;
            }
        },
    });

    return isReactComponent;
}

function nodeBase64ToUtf8(data) {
    return Buffer.from(data, 'base64').toString('utf-8');
}

async function detectReactComponentInFile(filename) {
    const params = {
        owner: CONST.GITHUB_OWNER,
        repo: CONST.APP_REPO,
        path: filename,
        ref: github.context.payload.pull_request.head.ref,
    };
    try {
        const {data} = await GithubUtils.octokit.repos.getContent(params);
        const content = 'content' in data ? nodeBase64ToUtf8(data.content || '') : data;
        return detectReactComponent(content, filename);
    } catch (error) {
        console.error(`An unknown error occurred with the GitHub API: ${error}, while fetching ${params}`);
    }
}

function filterFiles({filename, status}) {
    if (status !== 'added') {
        return false;
    }
    return filename.endsWith('.js') || filename.endsWith('.jsx') || filename.endsWith('.ts') || filename.endsWith('.tsx');
}

async function detectFunction(changedFiles) {
    const filteredFiles = _.filter(changedFiles, filterFiles);
    for (const file of filteredFiles) {
        const result = await detectReactComponentInFile(file.filename);
        if (result) {
            return true; // If the check is true, exit directly
        }
    }
    return false;
}

module.exports = {
    detectFunction,
    items,
};
