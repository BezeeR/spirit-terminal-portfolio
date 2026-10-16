# Portfolio security review — 2026-10-15

## Scope

Reviewed the portfolio source, production HTTP behavior, dependencies, Docker packaging, and its GitHub/Railway configuration. Checked browser storage failures, outbound links, contact behavior, and production asset delivery. This review covers the portfolio; it does not certify the separate CardSlate, TCG Buds, or Afterhours applications.

The portfolio does not connect to Supabase and has no database credentials. No Supabase migration or change to player data was needed.

## Findings addressed

| Finding | Resolution |
| --- | --- |
| SQLite contact messages lived in an ephemeral Railway container, with no message-delivery workflow | Retired the form and write endpoint. The accessible contact console links directly to Discord and GitHub. No visitor message or email collection remains. |
| Redundant API supplied content already bundled in the client | Removed the request and endpoint. Project destinations and descriptions have one source of truth. |
| Dependency audit reported nine vulnerable package entries, including transitive runtime/build packages | Applied compatible fixes, removed unused CORS dependencies, and pinned direct dependencies. Full `npm audit` reports zero advisories at review time; CI checks at moderate severity or above. An advisory is not by itself evidence that the running site was exploited. |
| Old Node 22.16 Docker base and root runtime | Updated both stages to Node 22.23.3 and run production as the unprivileged `node` user. |
| Missing asset URLs returned the HTML application | Missing assets, hidden files, source paths, and API routes now return 404; server/source files stay outside `dist`. |
| Mutable and fingerprinted files shared short-lived caching | Only fingerprinted assets receive immutable caching; HTML/unversioned assets revalidate. Precompressed JavaScript/CSS have encoding-aware caching. |
| Storage APIs could crash the app, and absent saved volume became zero | Catch blocked storage reads/writes and use the intended 34% default volume. |
| CSS background work continued in a hidden document | Pause background animation with document visibility; compact screens use a static atmosphere. |

The audit included the [proxy-addr advisory](https://github.com/advisories/GHSA-jqcg-44mw-7w3h) and [shell-quote advisory](https://github.com/advisories/GHSA-pqg4-j6r4-53mv). Updates also resolve the registry’s flagged browserslist, baseline-browser-mapping, nanoid, postcss, qs, and source-map-js entries.

## Verified boundaries

- No database, personal-data write endpoint, JSON body parser, or cross-origin API access remains.
- No Supabase service-role key, Discord token, or application secret is required in the portfolio client or server.
- React renders case-study copy as text; there is no `dangerouslySetInnerHTML`, `eval`, or user-provided HTML path.
- Project URL overrides permit HTTPS without username/password and otherwise use known defaults.
- CSP restricts scripts to the portfolio and YouTube player hosts; objects, framing, and form submissions are blocked. Inline styles remain allowed for the React accent and existing presentation styles; inline scripts and `unsafe-eval` are not allowed.
- Responses include `nosniff`, `X-Frame-Options: DENY`, referrer and permissions policies, and one-year HSTS for the portfolio host. HSTS does not include subdomains.
- In v0.5.1, first visitors choose music or quiet entry; returning visitors with music enabled load YouTube and attempt playback automatically. Quiet entry, pause, and collapse preserve a quiet return. Browser autoplay restrictions are respected, with an accurate Play fallback. External video availability and playback restrictions remain under YouTube/browser control.
- GitHub workflow permissions are limited to reading repository contents.
- HTTP regressions exercise asset encoding/cache negotiation, security headers, retired endpoints, and hidden/source-file paths.

Dependency results are a point-in-time check. Run the documented checks again when updating dependencies or deploying new code.
