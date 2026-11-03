# Writing and publishing

This vault is the `src/content` directory of the Astro site. Write posts in `blog/` (not `_bases/blog/`). Restart Obsidian after settings changes so the plugins load the updated configuration.

## Create a post

In `blog/`, press `Cmd+N` and choose **Posts** if prompted. New posts start with `draft: true`; change it to `false` when the post is ready to publish. The template leaves a blank line after the closing `---` and starts the body with `Write your post here.` Replace that starter text with your post. If editing frontmatter or body in the rendered editor is awkward, use the editor menu to switch to **Source mode**.

For a cover image, set `image` to a plain relative path such as `_assets/file.png` and set `imageAlt` to useful alternative text. Core Obsidian's Properties view is a sidebar editor for frontmatter; it is not an insertion point in the post body.

## Publish

Drafts remain off the website while `draft: true`, but this GitHub repository is public: committing and pushing a draft makes its Markdown publicly readable on GitHub. To keep a draft local, add its repository-relative path to `.git/info/exclude` (outside the vault). The current `agentic-mcp-cms.md` and `draft-workflow-example.md` drafts are locally excluded this way.

When ready to publish, remove the post's local exclusion if present, set `draft: false`, then commit and push your changes. The **Cmd+Shift+S** Git push command may only push existing commits, so commit first if it reports there is nothing to push.
