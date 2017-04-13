#!/usr/bin/env node

const fs = require('fs');

// capture stdin during commit hook?
// fs.createReadStream('/dev/tty').pipe(process.stdin);

const request = require('request');
const inquirer = require('inquirer');

let commitFile;
if (!process.env.DEBUG) {
  if (process.argv[0].endsWith('node')) {
    commitFile = process.argv[2];
  }
  else {
    commitFile = process.argv[1];
  }
  console.log('file=', commitFile);
  if (!commitFile) {
    console.error('[pmhack] did not get a commit file from git hook');
    process.exit(0);
  }
}

const token = process.env.ASANA_TOKEN;
const workspace = process.env.ASANA_WORKSPACE;
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
    if (err || !body.data) return cb(err || body);
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
    const msg = `\nasana task: ${ task.name }\nasana id: ${ task.id }`;
    if (commitFile) {
      console.log('got here');
      fs.appendFileSync(commitFile, msg);
    }
    else {
      console.log('if i had a commit file, i would have written:')
      console.log(msg);
    }
  });
});
