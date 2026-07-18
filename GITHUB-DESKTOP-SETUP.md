# Publish Spirit Terminal professionally with GitHub Desktop

This guide uses the recommended public repository name:

```text
spirit-terminal-portfolio
```

## 1. Extract the ZIP correctly

1. Open the ZIP.
2. Select **Extract all**.
3. Extract it to:

```text
Documents\GitHub\spirit-terminal-portfolio
```

4. Open the extracted folder.
5. Confirm `package.json`, `README.md`, `src`, `server`, and `.github` are directly inside it.

Avoid publishing a folder that contains another identical project folder inside it.

## 2. Open it in GitHub Desktop

1. Open **GitHub Desktop**.
2. Confirm you are signed into the `BezeeR` GitHub account.
3. Select **File → Add local repository**.
4. Select the extracted `spirit-terminal-portfolio` folder.
5. GitHub Desktop should report that the folder is not yet a Git repository.
6. Select **Create a repository**.

Use these values:

```text
Name: spirit-terminal-portfolio
Description: Full-stack React, TypeScript, Node.js, Express, and SQLite portfolio with an original late-night project-arena aesthetic.
Local path: Documents\GitHub
Git ignore: None
License: None
```

Do not ask GitHub Desktop to create another README or `.gitignore`; polished versions are already included.

## 3. Create the first commit

In the **Changes** tab, verify that the source files are visible and that these are not included:

```text
node_modules
dist
.env
*.sqlite
```

Use this commit summary:

```text
Initial release of Spirit Terminal portfolio
```

Optional description:

```text
Add the responsive React portfolio, Node and SQLite backend, procedural audio, CardSlate case studies, design documentation, and CI build workflow.
```

Select **Commit to main**.

## 4. Publish to GitHub

1. Select **Publish repository**.
2. Confirm the repository name is `spirit-terminal-portfolio`.
3. Keep the professional description above.
4. For a portfolio, clear **Keep this code private** so hiring managers and visitors can inspect it.
5. Publish to your personal `BezeeR` account, not an organization.
6. Select **Publish repository**.

## 5. Check the automated build

1. In GitHub Desktop, select **Repository → View on GitHub**.
2. Open the **Actions** tab.
3. Open the newest **Build portfolio** workflow.
4. Wait for the green check mark.

The included workflow runs `npm ci` and `npm run build` on Node 22.

## 6. Fill in the About panel

On the repository home page, select the gear icon beside **About**.

Use:

```text
Description:
Full-stack React, TypeScript, Node.js, Express, and SQLite portfolio with an original late-night project-arena aesthetic.

Website:
Leave blank until the portfolio is deployed.
```

Add these topics one at a time:

```text
react
typescript
vite
nodejs
express
sqlite
full-stack
portfolio
web-audio-api
responsive-design
accessibility
canvas-animation
```

Save the changes.

## 7. Add the social preview image

1. Open **Settings** in the repository.
2. Find **Social preview**.
3. Select **Edit → Upload an image**.
4. Upload:

```text
docs/social-preview.png
```

The included image is 1280 × 640 and optimized for GitHub link previews.

## 8. Create the first release

1. Open the repository home page.
2. Select **Releases → Create a new release**.
3. Select **Choose a tag** and create:

```text
v0.4.0
```

4. Release title:

```text
Spirit Terminal: After Hours v0.4
```

5. Release notes:

```text
First public portfolio release.

Highlights:
- Responsive project-arena interface
- CardSlate desktop, website, and Event Companion case studies
- React, TypeScript, Node.js, Express, and SQLite architecture
- Original procedural late-night lo-fi audio
- Accessible keyboard, touch, swipe, and reduced-motion behavior
- Automated GitHub Actions production build
```

6. Publish the release.

You do not need to upload `node_modules` or a source ZIP; GitHub automatically creates source archives for the tag.

## 9. Pin it to your GitHub profile

1. Open your `BezeeR` profile.
2. Find **Pinned** or **Popular repositories**.
3. Select **Customize your pins**.
4. Select `spirit-terminal-portfolio`.
5. Save.

## 10. Professional profile text

Recommended GitHub bio:

```text
Full-stack developer building polished desktop, web, and mobile product systems. Creator of CardSlate.
```

Recommended profile website later:

```text
Your deployed Spirit Terminal URL
```

## Normal update workflow

Whenever you change the portfolio:

1. Open the project through GitHub Desktop.
2. Open it in VS Code.
3. Make and save changes.
4. Run `npm run build`.
5. Review the **Changes** tab.
6. Write a specific commit message.
7. Select **Commit to main**.
8. Select **Push origin**.
9. Confirm the Actions check becomes green.

Examples of strong commit messages:

```text
Improve mobile project navigation
Add CardSlate convention case study
Refine ambient audio controls
Fix contact validation on small screens
```
