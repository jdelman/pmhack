# pmhack

a `commit-msg` hook for git to integrate w/asana

## but how?

### environment variables

- get an asana personal access token, assign to `ASANA_TOKEN`
- get your workspace, assign to `ASANA_WORKSPACE`

### clone the repo
- put it somewhere. just do it
- run `npm install`
- make sure `commit-msg.sh` is executable
  - you could try `chmod +x commit-msg.sh`
- symlink `commit-msg.sh` -> `.git/hooks/commit-msg` in your project
  - you might try `ln -s ./commit-msg.sh /absolute/path/to/my/project/.git/hooks/commit-msg`

### done

- make a commit
- check your `git log`
- 😎
