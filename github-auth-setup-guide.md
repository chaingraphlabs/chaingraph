# GitHub Authentication Setup for Private Packages

To use and publish private packages on GitHub Packages, you need to set up proper authentication. This guide explains how to create a GitHub Personal Access Token (PAT) and configure your environment.

## Creating a GitHub Personal Access Token

1. Go to your GitHub account settings
2. Navigate to **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. Click **Generate new token**
4. Give your token a descriptive name (e.g., "Chaingraph Packages")
5. Set the expiration as needed (you can choose "No expiration" for long-term use)
6. Select the following scopes:
   - `repo` (full control of private repositories)
   - `read:packages` (download packages)
   - `write:packages` (publish packages)
   - `delete:packages` (optional, for package management)
7. Click **Generate token**
8. **Important**: Copy the token immediately and store it securely. You won't be able to see it again!

## Setting Up Authentication

### Option 1: Project-level Configuration

Create or edit an `.npmrc` file in your project root:

```
@badaitech:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Then set the `GITHUB_TOKEN` environment variable:

```bash
# Linux/macOS
export GITHUB_TOKEN=your_github_pat_here

# Windows (Command Prompt)
set GITHUB_TOKEN=your_github_pat_here

# Windows (PowerShell)
$env:GITHUB_TOKEN="your_github_pat_here"
```

### Option 2: Global Configuration

Edit your global `~/.npmrc` file:

```
@badaitech:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=your_github_pat_here
```

Replace `your_github_pat_here` with your actual GitHub personal access token.

## Verifying Authentication

Test your authentication by running:

```bash
npm whoami --registry=https://npm.pkg.github.com
```

If successful, it should display your GitHub username.

## CI/CD Authentication

For GitHub Actions:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: '22'
    registry-url: 'https://npm.pkg.github.com'
    scope: '@badaitech'

- name: Install dependencies
  run: npm install
  env:
    NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

For other CI systems, set the `GITHUB_TOKEN` or `NODE_AUTH_TOKEN` environment variable with your PAT.
