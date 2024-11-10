import {
  createServer,
  type Server,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { type AddressInfo } from 'node:net';
import { chromium, type Browser } from 'playwright';
import { extname } from 'node:path';

import {
  TestCaseExecutor,
  type TestResult,
  type TestSuiteResult,
  toTestSuiteResult,
  type EnvInfo,
} from './executor.ts';

export interface PageContext {
  id: string;
  files: Map<string, string | Uint8Array>;
  mainUrl: string;
  mainIsModule: boolean;
}

function getContentType(filename: string): string {
  switch (extname(filename)) {
    case '.js':
      return 'text/javascript';

    case '.txt':
      return 'text/plain';

    default:
      throw new Error(`TODO: Handle extension ${extname(filename)}`);
  }
}

export abstract class BundlingTestCaseExecutor extends TestCaseExecutor {
  protected abstract getEnvInfo(): Promise<EnvInfo>;
  protected abstract setupPageContext(
    filename: string,
    cwd: string,
    pageContext: PageContext,
  ): Promise<TestResult[] | null>;

  #pageContexts = new Map<string, PageContext>();

  #server = new Promise<Server>((resolve) => {
    const inst = createServer((req, res) => this.#handleRequest(req, res));
    inst.unref();
    inst.listen(0, () => resolve(inst));
  });

  #handleRequest(req: IncomingMessage, res: ServerResponse) {
    if (req.url === '/favicon.ico') {
      res.end('');
      return;
    }

    const routeMatch = `${req.url}`.match(/^\/([^/]+)(\/(?:.*))/);
    const pageContext = this.#pageContexts.get(routeMatch?.[1]!);
    if (!routeMatch || !pageContext) {
      res.statusCode = 404;
      console.error('Unexpected request: %s %s', req.method, req.url);
      res.end('Not found');
      return;
    }
    const subPath = routeMatch[2];
    if (subPath === '/') {
      res.setHeader('Content-Type', 'text/html');
      res.end(`<!-- TODO: Make this a proper prebundled script? -->
<script src="https://unpkg.com/expect@24.5.0"></script>
<script>
(function() {
const tests = new Map();

let ranTests = false;

async function runTests() {
  if (ranTests) {
    return;
  }
  ranTests = true;

  for (const [description, fn] of tests) {
    let error = null;
    try {
      await fn();
    } catch (e) {
      error = {
        message: \`\${e instanceof Error ? e.message : e}\`,
        stack: e instanceof Error ? e.stack : null,
      };
    }
    console.log(JSON.stringify({ description, error }));
  }
  console.log('<done>');
}

Object.assign(globalThis, {
  test: async (description, fn) => {
    if (tests.has(description)) {
      throw new Error(\`Duplicate test with description: \${description}\`);
    }
    if (ranTests) {
      throw new Error(\`Non-synchronous test registration for \${description}\`);
    }
    tests.set(description, fn);

    queueMicrotask(runTests);
  },
});

setTimeout(() => {
  if (!ranTests) runTests();
}, 150);
})();
</script>
<script src="/${pageContext.id}${pageContext.mainUrl}"${pageContext.mainIsModule ? ' type="module"' : ''}></script>`);
      return;
    }

    const fileContents = pageContext.files.get(subPath);
    if (!fileContents) {
      res.statusCode = 404;
      console.error('Unexpected request: %s %s', req.method, req.url);
      res.end('Not found');
      return;
    }

    res.setHeader('Content-Type', getContentType(subPath));
    res.end(fileContents);
  }

  async #runTestCase(
    filename: string,
    cwd: string,
    browser: Browser,
    pageContext: PageContext,
  ): Promise<TestResult[]> {
    const earlyErrors = await this.setupPageContext(filename, cwd, pageContext);
    if (earlyErrors) {
      return earlyErrors;
    }

    const pageErrors: Error[] = [];

    let resolve: () => void;
    const allDone = new Promise<void>((r) => {
      resolve = r;
    });

    const lines: TestResult[] = [];

    const page = await browser.newPage();
    page.on('pageerror', (error) => {
      pageErrors.push(error);
    });
    page.on('console', (consoleMessage) => {
      if (consoleMessage.text() === '<done>') {
        resolve();
        return;
      }
      if (consoleMessage.type() !== 'log') {
        console.log(consoleMessage);
        return;
      }
      lines.push(JSON.parse(consoleMessage.text()) as TestResult);
    });
    const port = await this.#server.then(
      (s) => (s.address() as AddressInfo).port,
    );
    const pageUrl = `http://127.0.0.1:${port}/${pageContext.id}/`;
    await page.goto(pageUrl);
    await Promise.race([
      allDone,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Test timed out')), 1000);
      }),
    ]);
    await page.close();

    if (pageErrors.length) {
      return pageErrors.map((err) => ({
        description: 'Failed to run on page',
        error: {
          message: err.message,
          stack: err.stack,
        },
      }));
    }

    return lines;
  }

  async run(
    filenames: string[],
    cwd: string,
  ): Promise<Map<string, TestSuiteResult>> {
    const browser = await chromium.launch();
    const env = await this.getEnvInfo();

    const suites = new Map<string, TestSuiteResult>();
    for (const filename of filenames) {
      const pageContext: PageContext = {
        id: crypto.randomUUID(),
        files: new Map<string, string>(),
        mainUrl: '/main.js',
        mainIsModule: false,
      };
      this.#pageContexts.set(pageContext.id, pageContext);
      const results = await this.#runTestCase(
        filename,
        cwd,
        browser,
        pageContext,
      );
      suites.set(filename, toTestSuiteResult(env, filename, results));
    }
    await browser.close();
    return suites;
  }
}
