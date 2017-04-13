# pmhack

a `commit-msg` hook for git to integrate w/asana

## but how?

### environment variables

- get an asana personal access token, assign to `ASANA_TOKEN`
- get your workspace, assign to `ASANA_WORKSPACE`

### clone the repo
- put it somewhere. just do it
- run `npm install`
- symlink or copy `commit-msg` to the `.git/hooks` directory of your project

### done

- make a commit
- check your `git log`
- 😎
