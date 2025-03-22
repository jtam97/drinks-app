## Deployment to GitHub Pages

To deploy the frontend to GitHub Pages, follow these steps:

1. Save any uncommitted changes:
```bash
git stash
```

2. Switch to gh-pages branch (and clear it if necessary):
```bash
git checkout gh-pages
git rm -rf .
```

3. Copy frontend files from main:
```bash
git checkout main -- frontend
```

4. Move frontend files to root:
```bash
mv frontend/* .
```

5. Commit and push changes:
```bash
git add .
git commit -m "Update gh-pages with latest frontend"
git push origin gh-pages --force
```

6. Return to main branch:
```bash
git checkout main
git stash pop  # only if you stashed changes in step 1
```