import { describe, it, expect } from 'vitest';

import { NormalizedSupportHistory } from './compat_data.ts';
import {
  type Compat,
  type PlatformId,
  type SupportHistoryEntry,
  type SupportStatement,
} from './compat_data_schema.ts';

const PLATFORM_ID: PlatformId = 'bun';

function makeCompat(support?: SupportStatement): Compat {
  return {
    description: 'x',
    support: {
      bun: support,
    },
    status: {
      standard_track: true,
      deprecated: false,
      experimental: false,
    },
  };
}

describe('NormalizedSupportHistory', () => {
  it('generates empty history entries', () => {
    expect(
      new NormalizedSupportHistory(makeCompat(), PLATFORM_ID).toJSON(),
    ).toEqual({
      version_added: false,
    });
  });

  it('parses valid histories', () => {
    const testCases: [SupportStatement, string][] = [
      [{ version_added: false }, '0.0.0: none'],
      [{ version_added: '1.2.3' }, '1.2.3: full\n0.0.0: none'],
      [
        { version_added: '1.2.3', notes: ['a', 'b'] },
        '1.2.3: full - ["a","b"]\n0.0.0: none',
      ],
      [
        {
          version_added: '1.2.3',
          notes: ['a', 'b'],
          partial_implementation: true,
        },
        '1.2.3: partial - ["a","b"]\n0.0.0: none',
      ],
      [
        {
          version_added: '1.2.3',
          version_removed: '2.3.1',
          notes: ['a', 'b'],
          partial_implementation: true,
        },
        '2.3.1: none\n1.2.3: partial - ["a","b"]\n0.0.0: none',
      ],
      [
        {
          version_added: '1.2.3',
          version_last: '2.2.39',
          version_removed: '2.3.0',
          notes: ['a'],
          partial_implementation: true,
        },
        '2.3.0: none\n2.2.39: partial - ["a"]\n1.2.3: partial - ["a"]\n0.0.0: none',
      ],
      [
        [
          {
            version_added: '1.2.3',
          },
        ],
        '1.2.3: full\n0.0.0: none',
      ],
      [
        [
          {
            version_added: '1.2.3',
          },
          {
            version_added: '1.2.0',
            version_removed: '1.2.3',
            version_last: '1.2.2',
            partial_implementation: true,
            notes: ['a'],
          },
        ],
        '1.2.3: full\n1.2.2: partial - ["a"]\n1.2.0: partial - ["a"]\n0.0.0: none',
      ],
    ];

    for (const [history, expected] of testCases) {
      expect(
        new NormalizedSupportHistory(
          makeCompat(history),
          PLATFORM_ID,
        ).toString(),
      ).toEqual(expected);
    }
  });

  it('preserves valid histories', () => {
    const histories: SupportStatement[] = [
      { version_added: false },
      { version_added: false, notes: ['a', 'b'] },
      { version_added: '1.2.3' },
      { version_added: '1.2.3', notes: ['a', 'b'] },
      {
        version_added: '1.2.3',
        notes: ['a', 'b'],
        partial_implementation: true,
      },
      {
        version_added: '1.2.3',
        version_removed: '2.3.1',
        notes: ['a', 'b'],
        partial_implementation: true,
      },
      [
        {
          version_added: '1.2.3',
        },
        {
          version_added: '1.2.0',
          version_removed: '1.2.3',
          version_last: '1.2.2',
          partial_implementation: true,
          notes: ['a'],
        },
      ],
    ];

    for (const history of histories) {
      expect(
        JSON.parse(
          JSON.stringify(
            new NormalizedSupportHistory(makeCompat(history), PLATFORM_ID),
          ),
        ),
      ).toEqual(history);
    }
  });
});
