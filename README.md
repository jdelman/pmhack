# pmhack

a `commit-msg` hook for git to integrate w/asana

## but how?

### environment variables

- get an asana personal access token, assign to `ASANA_TOKEN`
- get your workspace, assign to `ASANA_WORKSPACE`
- get your repo's owner name -- i.e., `jdelman/pmhack`, and assign to `ASANA_GITHUB_REPO`

### clone the repo
- put it somewhere. just do it
- run `npm install`
- make sure `commit-msg.sh` and `post-commit.sh` are executable
  - you could try `chmod +x commit-msg.sh post-commit.sh`
- symlink `commit-msg.sh` -> `.git/hooks/commit-msg` in your project
  - you might try `ln -s ./commit-msg.sh /absolute/path/to/my/project/.git/hooks/commit-msg`
  - make sure to do the same thing for `post-commit.sh` -> `.git/hooks/post-commit`

### done

- make a commit
- check your `git log`
- check your asana task
- 😎
