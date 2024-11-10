import { createRsbuild, version } from '@rsbuild/core';
import { join, relative } from 'node:path';
import { createFsFromVolume, Volume } from 'memfs';

import { type TestResult, type EnvInfo } from '../executor.ts';
import {
  BundlingTestCaseExecutor,
  type PageContext,
} from '../bundling_executor.ts';

export class RsbuildTestCaseExecutor extends BundlingTestCaseExecutor {
  protected override async getEnvInfo(): Promise<EnvInfo> {
    return {
      id: 'rsbuild',
      version,
    };
  }

  protected override async setupPageContext(
    filename: string,
    cwd: string,
    pageContext: PageContext,
  ): Promise<TestResult[] | null> {
    const outdir = join(cwd, '.tmp', pageContext.id);
    const rsbuild = await createRsbuild({
      cwd: cwd,
      rsbuildConfig: {
        root: cwd,
        mode: 'development',
        source: {
          entry: {
            main: `./${filename}`,
          },
        },
        output: {
          assetPrefix: `/${pageContext.id}/`,
          target: 'web',
          distPath: {
            root: outdir,
          },
        },
        dev: {
          assetPrefix: `/${pageContext.id}/`,
        },
        performance: {
          printFileSize: false,
        },
      },
    });
    const volume = new Volume();
    const fs = createFsFromVolume(volume);
    const compiler = await rsbuild.createCompiler();
    compiler.outputFileSystem = fs as typeof compiler.outputFileSystem;

    let stats;

    try {
      ({ stats } = await rsbuild.build({
        compiler: compiler,
        watch: false,
      }));
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

    if (!stats) {
      throw new Error('Expected non-null stats');
    }

    const { errors, assetsByChunkName } = stats?.toJson({ logging: 'none' });

    if (errors?.length) {
      return errors.map((err) => ({
        description: err.message,
        error: {
          message: err.message,
        },
      }));
    }

    pageContext.mainUrl = `/${assetsByChunkName!['main'][0]}`;

    function forwardFiles(subPath: string = '') {
      const fsPath = `${outdir}${subPath}`;
      for (const outFile of fs.readdirSync(fsPath)) {
        const newSubPath = `${subPath}/${outFile}`;
        const newFsPath = `${outdir}${newSubPath}`;
        try {
          const contents = fs.readFileSync(newFsPath);
          pageContext.files.set(newSubPath, contents);
          continue;
        } catch (e) {
          if ((e as any)?.code !== 'EISDIR') {
            throw e;
          }
        }
        forwardFiles(newSubPath);
      }
    }

    forwardFiles();

    return null;
  }
}
