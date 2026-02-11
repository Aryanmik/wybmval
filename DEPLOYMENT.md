# Valentine site – deployment (GitHub Pages)

## 1. Set up a GitHub repo

- Go to [github.com](https://github.com) and sign in.
- Click **New** (or the **+** icon) → **New repository**.
- Choose a name (e.g. `valentine` or `wybmval`).
- Leave **Add a README** unchecked if you’re pushing this project from your machine.
- Click **Create repository**.

## 2. Upload the project

**Option A – From your computer (Git)**

In your project folder:

```bash
cd /path/to/wybmval
git init
git add index.html styles.css script.js assets/
git commit -m "Initial Valentine site"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your GitHub username and repo name.

**Option B – Drag and drop**

- On the new repo page, click **uploading an existing file**.
- Drag and drop the project folder contents (or each file/folder: `index.html`, `styles.css`, `script.js`, `assets/`).
- Commit the changes.

**Add your own files (optional)**

- **Music:** Add your background song as `assets/song.mp3`. If you don’t, the page will load but no audio will play.
- **Photos:** Replace `assets/photos/photo1.svg`, `photo2.svg`, `photo3.svg` with your own images (e.g. `photo1.jpg`, `photo2.jpg`, `photo3.jpg`) and update the `src` in `index.html` to match.

## 3. Enable GitHub Pages

- In the repo, go to **Settings** → **Pages** (left sidebar).
- Under **Source**, choose **Deploy from a branch**.
- Under **Branch**, select `main` and folder **/ (root)**.
- Click **Save**.

Wait 1–2 minutes. GitHub will build and deploy the site.

## 4. Hosted URL and testing

- **URL:**  
  `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`  
  Example: `https://jane.github.io/valentine/`

- **Testing**
  - Open the URL on desktop and mobile to check layout and buttons.
  - **Audio:** Many browsers block autoplay. If the song doesn’t start on load, tap or click anywhere on the page once; the first interaction unlocks audio and starts playback. Test in both desktop and mobile browsers.

## Quick checklist

- [ ] Repo created and project pushed (or uploaded).
- [ ] GitHub Pages set to **main** branch, **/ (root)**.
- [ ] (Optional) `assets/song.mp3` added and (optional) gallery images replaced and paths updated in `index.html`.
- [ ] Site opens at `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`.
- [ ] Tap/click once if needed to start background music.
