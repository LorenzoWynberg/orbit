<!-- TRINITY-MANAGED-START -->

## Documentation

`apps/web/` is a package (GitHub Pages, Chrome Web Store) in the `orbit` repo of the orbit project. Trinity generates this section from the project packages and rewrites it whenever they change, so write your own notes outside it.

Its documentation starts at [`.trinity/docs/index.md`](.trinity/docs/index.md), which links every page in the `.trinity/docs/` families:

- `rules/<topic>.md`: the rules every change in the package follows
- `gotchas/<tech>.md`: one page per technology in the package stack
- `tech-guide/<section>/<chapter>.md`: how the code works
- `user-guide/<section>/<chapter>.md`: what a person sees and does

<!-- TRINITY-MANAGED-END -->

# @orbit/web

The converter page, deployed to GitHub Pages and reused by the Chrome extension popup.

`DESIGN.md` is the source of the design: its tokens are materialized in `src/styles/tokens.css`, and `src/styles/app.css` uses them only through `var(--…)`.

The package manifests and lockfiles are the record of the stack.
