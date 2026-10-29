# Workspace loading regression

This narrow runner executes the four F1 scenarios against compiled Next/React:
cleanup before response, response before cleanup, and old response/rejection while
a new request remains pending. The original assertions live in
`workspace-loading-browser.mjs`; synthetic GET fixtures live in
`fixtures/workspace-loading.mjs`. No files from Temp or another checkout are needed.

## Clean-copy commands (PowerShell)

Use Node 22 LTS, pnpm 11.5.0 (packageManager), and the pinned Playwright 1.64.1.
Use a clean candidate copy without `.env.local`, builds or private data.

```powershell
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
$env:NEXT_TELEMETRY_DISABLED = '1'
$env:NEXT_PUBLIC_API_BASE_URL = 'http://127.0.0.1:1'
$env:NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'synthetic-client-id'
pnpm build
pnpm test:workspace-loading
```

The browser download needs registry/CDN access, not application API access. Linux
may additionally require Playwright's documented OS browser dependencies; the
current evidence is Windows only. A preinstalled system Chrome is not required.

The runner starts its own Next process on an available loopback port, waits for
readiness, blocks external browser traffic, fulfills API requests with synthetic
data and rejects/counts all attempted API mutations. It closes its browser and
server in `finally`; it does not connect to or stop an existing development server.
Do not point it at an application API or supply real credentials. Next's compiled
public configuration comes from the build step; the loopback port-1 URL above is
deliberately non-operational. External Google scripts are blocked.

Evidence defaults to ignored `test-results/workspace-loading/`; set
`WORKSPACE_BROWSER_OUTPUT` to a private output directory to retain results and
screenshots elsewhere. No outputs are test inputs. Nonzero exit is a failure.
The startup deadline is a harness bound, not a synchronization assertion. Scenario
ordering uses retained responses, abort/settlement signals and controlled promises.

The old request deliberately ignores abort in the ownership cases. Thus two
in-flight HTTP fixtures across invalidated/new contexts are intentional; double
click must still create only one request in the new controller. This does not
certify remote cancellation, real token renewal, commercial saves or activation.
