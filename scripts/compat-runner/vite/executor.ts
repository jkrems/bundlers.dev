import { join } from 'node:path';
import { build, version } from 'vite';

import { type TestResult, type PlatformInfo } from '../executor.ts';
import {
  BundlingTestCaseExecutor,
  type PageContext,
} from '../bundling_executor.ts';
import { PLATFORMS } from '../compat_data_schema.ts';

export class ViteTestCaseExecutor extends BundlingTestCaseExecutor<'vite'> {
  protected override async getPlatformInfo(): Promise<PlatformInfo<'vite'>> {
    return {
      ...PLATFORMS.vite,
      version: version,
    };
  }

  protected override async setupPageContext(
    filename: string,
    cwd: string,
    pageContext: PageContext,
  ): Promise<TestResult[] | null> {
    const outDir = join(cwd, '.tmp', pageContext.id);
    let output;
    try {
      output = await build({
        logLevel: 'silent',
        root: cwd,
        base: `/${pageContext.id}/`,
        mode: 'development',
        configFile: false,
        envFile: false,
        build: {
          write: false,
          rollupOptions: {
            input: {
              main: `./${filename}`,
            },
          },
          outDir,
        },
      });
      if (!Array.isArray(output)) {
        output = [output];
      }
    } catch (e) {
      return [
        {
          description: 'Build test suite',
          error: {
            message: `Test suite failed to build: ${e instanceof Error ? e.message : e}`,
          },
        },
      ];
    }

    for (const out of output) {
      if (!('output' in out)) {
        continue;
      }
      for (const outFile of out.output) {
        const outFileType = outFile.type;
        if (outFile.type === 'chunk') {
          const urlPath = `/${outFile.fileName}`;
          if (outFile.name === 'main') {
            pageContext.mainUrl = urlPath;
            pageContext.mainIsModule = true;
          }
          pageContext.files.set(urlPath, outFile.code);
        } else if (outFile.type === 'asset') {
          const urlPath = `/${outFile.fileName}`;
          pageContext.files.set(urlPath, outFile.source);
        } else {
          throw new Error(`TODO: Implement outFile.type == ${outFileType}`);
        }
      }
    }

    return null;
  }
}
