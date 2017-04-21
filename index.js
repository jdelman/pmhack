#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

// capture stdin during commit hook?
// fs.createReadStream('/dev/tty').pipe(process.stdin);

const request = require('request');
const inquirer = require('inquirer');

/* warm up */
let commitFile;
let hook;
const { DEBUG } = process.env;
if (!DEBUG) {
  // check hook
  hook = process.argv[2];
  if (hook !== 'commit-msg' && hook !== 'post-commit') {
    console.error('[pmhack] please specify whether you need the `commit-msg` or `post-commit` hook.');
    process.exit(1);
  }

  // check commit file
  if (hook === 'commit-msg') {
    commitFile = process.argv[3];
    // console.log('file=', commitFile);
    if (!commitFile) {
      console.error('[pmhack] did not get a commit file from git hook');
      process.exit(1);
    }
  }
}
else {
  hook = 'commit-msg';
}

if (DEBUG) {
  console.log('chose hook:', hook);
  console.log('args:', process.argv);
}

const token = process.env.ASANA_TOKEN;
const workspace = process.env.ASANA_WORKSPACE;
const repo = process.env.ASANA_GITHUB_REPO;
if (!token) {
  console.error(`
    You need to set your personal Asana token in the environment
    variable ASANA_TOKEN.

    You can obtain a token by going to
    My Profile > Apps > Manage Developer Apps > Personal Access Token.
  `);
  process.exit(1);
}
if (!workspace) {
  console.error(`
    You need to set your Asana workspace (ASANA_WORKSPACE environment
    variable).
  `);
  process.exit(1);
}
if (!DEBUG && !repo) {
  console.error(`
    You need to set the GitHub repo (i.e. REPO_OWNER/REPO_NAME) in the
    ASANA_GITHUB_REPO environment variable.
  `);
  process.exit(1);
}

const asana = request.defaults({
  baseUrl: 'https://app.asana.com/api/1.0/',
  headers: {
    Authorization: `Bearer ${ token }`
  },
  json: true
});

const getTasks = cb => {
  asana({
    method: 'GET',
    uri: 'tasks',
    qs: {
      assignee: 'me',
      workspace: workspace,
      completed: false,
      opt_fields: 'id,name,due_on'
    }
  }, (err, resp, body) => {
    if (err || !body.data) return cb(err || JSON.stringify(body));
    return cb(null, body.data);
  });
};

const addCommentToTask = (taskId, comment, cb) => {
  asana({
    method: 'POST',
    uri: `tasks/${ taskId }/stories`,
    json: { data: { text: comment } }
  }, (err, resp, body) => {
    if (err || !body.data) return cb(err || JSON.stringify(body));
    return cb(null, body.data);
  });
};

const MAX_LEN = 70
const getShortTask = name => {
  let out = name;
  if (name.length > MAX_LEN) {
    out = name.slice(0, MAX_LEN - 1) + '…';
  }
  return out;
};

const getLastCommitHash = cb => {
  child_process.exec('git rev-list HEAD', (err, stdout) => {
    if (err) return cb(err);

    // should be three lines returned -- we just want the first.
    const hash = stdout.split('\n')[0];
    return cb(null, hash);
  });
};

const getPathToLastAsanaTask = () => path.resolve(process.env.HOME, '.LAST_ASANA_TASK');


/* program execution */

if (hook === 'commit-msg') {
  // prompt the user with a list of their tasks.
  // on selection, add that task's URL to the commit description.

  getTasks((err, tasks) => {
    if (err) {
      console.error(`Error getting your Asana tasks: ${ err }`);
      process.exit(1);
    }
    // set up questions
    const choices = [{
      name: '[default] Do not associate a task with this commit',
      value: null
    }].concat(tasks.map(task => ({
      name: getShortTask(task.name),
      value: task
    })));
    inquirer.prompt({
      type: 'list',
      name: 'task',
      message: 'Is there a task associated with this commit?',
      default: null,
      choices: choices,
      pageSize: 8
    }).then(answer => {
      const { task } = answer;

      // if they chose no task, set the last asana task id to an empty string
      if (!task) {
        fs.writeFileSync(getPathToLastAsanaTask(), '');
        process.exit(0);
      }

      const msg = `\nasana task: ${ task.name }\nasana url: https://app.asana.com/0/${ process.env.ASANA_WORKSPACE }/${ task.id }`;
      if (commitFile) {
        // console.log('got here');
        fs.appendFileSync(commitFile, msg);
      }
      else {
        console.log('if i had a commit file, i would have written:')
        console.log(msg);
      }

      // keep a hidden reference to the last asana task in the user's directory
      fs.writeFileSync(getPathToLastAsanaTask(), task.id);
    });
  });
}
else if (hook === 'post-commit') {
  // take the commit hash and add it as a comment to the asana task.
  fs.readFile(getPathToLastAsanaTask(), { encoding: 'utf8' }, (err, taskId) => {
    if (err) {
      console.error('[pmhack] error getting last task id:', err);
      process.exit(1);
    }
    else if (!taskId) {
      // we didn't assign a task id
      console.log('[pmhack] no task id set');
      process.exit(0);
    }

    getLastCommitHash((err, hash) => {
      if (err) {
        console.error(`[pmhack] error getting last commit hash: ${ err }`);
        process.exit(1);
      }

      const comment = `referenced by https://github.com/${ repo }/commit/${ hash }`;
      addCommentToTask(taskId, comment, (err, ok) => {
        if (err) {
          console.error(`error adding comment to task: ${ err }`);
          process.exit(1);
        }

        // success!
        console.log(`successfully added reference to commit ${ hash } in asana task ${ taskId }`);
        process.exit(0);
      });
    });
  });
}