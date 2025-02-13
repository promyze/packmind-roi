# Code Review Data Fetcher

A command-line tool to fetch and export code review data from GitHub or GitLab merge requests.

## Installation

```bash
node git.cjs [options]
```

### Required Options

- `-k, --git-token <token>`: Git authentication token (GitHub or GitLab personal access token)
- `-f, --from <date>`: Start date in ISO 8601 format (e.g., "2024-01-01")
- `-r, --repositories <repos>`: Comma-separated list of repositories to fetch from (e.g., "owner/repo1,owner/repo2")

### Optional Options

- `--no-diff`: Disable code diff export in the output
- `-t, --to <date>`: End date in ISO 8601 format (defaults to current date) [ WIP ]
- `-p, --git-provider <provider>`: Git provider to use - "github" or "gitlab" (defaults to "gitlab")
- `-u, --git-url <url>`: Custom Git URL for self-hosted instances
- `-o, --output <file>`: Output JSON file path (defaults to "comments.json")
- `-i, --includes <include>`: Comma-separated list of glob patterns to filter files in diffs
- `-v, --verbose`: Enable verbose logging

## Examples

Fetch GitLab merge requests from the last month:
```bash
node ./dist/bundle.cjs \
  -k your_gitlab_token \
  -u https://gitlab.example.com \
  -f 2024-02-01 \
  -r group/project1,group/project2 \
  -o output.json
```

Fetch GitHub PRs with specific file types:
```bash
node ./dist/bundle.cjs \
  -k your_github_token \
  -f 2024-01-01 \
  -t 2024-03-01 \
  -p github \
  -r owner/repo \
  -i "*.ts,*.js" \
  -o github_prs.json
```

### More on includes

The `-i, --includes` option accepts glob patterns to filter which files should be included in the diff output. Multiple patterns can be specified as a comma-separated list.

Examples of include patterns:
```bash
# Only TypeScript files
-i "*.ts"

# TypeScript and JavaScript files
-i "*.ts,*.js"

# Files in src directory and its subdirectories
-i "src/**/*"

# Specific file types in specific directories
-i "src/**/*.ts,test/**/*.spec.ts"

# Multiple specific paths
-i "src/models/*.ts,src/controllers/*.js,*.json"
```

The tool will only include diffs from files that match at least one of the specified patterns. If no includes are specified, all files will be included in the output.

## Output

The tool generates a JSON file containing merge request data including:
- Basic PR/MR information (title, description, author)
- Creation and merge dates
- Code changes (unless --no-diff is specified)
- File changes matching include patterns (if specified)


### GitLab
Generate a personal access token with `api` scope at: GitLab > Settings > Access Tokens

### GitHub
Generate a personal access token with `repo` scope at: GitHub > Settings > Developer settings > Personal access tokens

## License

[Add your license here]
