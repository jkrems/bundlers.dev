import { z, defineCollection } from 'astro:content';

const bundlerCompatSchema = z
  .record(
    z.union([
      z
        .object({
          __compat: z
            .object({
              description: z
                .string()
                .describe(
                  'A string containing a human-readable description of the feature.',
                )
                .optional(),
              mdn_url: z
                .string()
                .url()
                .regex(new RegExp('^https://developer\\.mozilla\\.org/docs/'))
                .describe(
                  'A URL that points to an MDN reference page documenting the feature. The URL should be language-agnostic.',
                )
                .optional(),
              spec_url: z
                .union([
                  z
                    .string()
                    .url()
                    .regex(
                      new RegExp(
                        '(^https://[^#]+#.+)|(^https://github.com/WebAssembly/.+)|(^https://registry.khronos.org/webgl/extensions/[^/]+/)',
                      ),
                    ),
                  z
                    .array(
                      z
                        .string()
                        .url()
                        .regex(
                          new RegExp(
                            '(^https://[^#]+#.+)|(^https://github.com/WebAssembly/.+)|(^https://registry.khronos.org/webgl/extensions/[^/]+/)',
                          ),
                        ),
                    )
                    .min(2),
                ])
                .describe(
                  'An optional URL or array of URLs, each of which is for a specific part of a specification in which this feature is defined. Each URL must contain a fragment identifier.',
                )
                .optional(),
              tags: z
                .array(z.any())
                .min(1)
                .describe(
                  'An optional array of strings allowing to assign tags to the feature.',
                )
                .optional(),
              source_file: z
                .string()
                .describe(
                  'The path to the file that defines this feature in browser-compat-data, relative to the repository root. Useful for guiding potential contributors towards the correct file to edit. This is automatically generated at build time and should never manually be specified.',
                )
                .optional(),
              support: z.record(
                z.union([
                  z
                    .object({
                      version_added: z
                        .union([
                          z
                            .string()
                            .regex(
                              new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$'),
                            ),
                          z.boolean().nullable(),
                        ])
                        .describe(
                          'A string (indicating which browser version added this feature), the value true (indicating support added in an unknown version), the value false (indicating the feature is not supported), or the value null (indicating support is unknown).',
                        ),
                      version_removed: z
                        .union([
                          z
                            .string()
                            .regex(
                              new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$'),
                            ),
                          z.literal(true),
                        ])
                        .describe(
                          'A string, indicating which browser version removed this feature, or the value true, indicating that the feature was removed in an unknown version.',
                        )
                        .optional(),
                      version_last: z
                        .union([
                          z
                            .string()
                            .regex(
                              new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$'),
                            ),
                          z.literal(true),
                        ])
                        .describe(
                          'A string, indicating the last browser version that supported this feature, or the value true, indicating that the feature was removed in an unknown version. This is automatically generated.',
                        )
                        .optional(),
                      prefix: z
                        .string()
                        .describe(
                          "A prefix to add to the sub-feature name (defaults to empty string). If applicable, leading and trailing '-' must be included.",
                        )
                        .optional(),
                      alternative_name: z
                        .string()
                        .describe(
                          'An alternative name for the feature, for cases where a feature is implemented under an entirely different name and not just prefixed.',
                        )
                        .optional(),
                      flags: z
                        .array(
                          z
                            .object({
                              type: z
                                .enum(['preference', 'runtime_flag'])
                                .describe(
                                  'An enum that indicates the flag type.',
                                ),
                              name: z
                                .string()
                                .describe(
                                  'A string giving the name of the flag or preference that must be configured.',
                                ),
                              value_to_set: z
                                .string()
                                .describe(
                                  'A string giving the value which the specified flag must be set to for this feature to work.',
                                )
                                .optional(),
                            })
                            .strict(),
                        )
                        .min(1)
                        .describe(
                          'An optional array of objects describing flags that must be configured for this browser to support this feature.',
                        )
                        .optional(),
                      impl_url: z
                        .union([
                          z
                            .string()
                            .url()
                            .regex(
                              new RegExp(
                                '^https://(trac.webkit.org/changeset/|hg.mozilla.org/mozilla-central/rev/|crrev.com/|bugzil.la/|crbug.com/|webkit.org/b/)',
                              ),
                            ),
                          z
                            .array(
                              z
                                .string()
                                .url()
                                .regex(
                                  new RegExp(
                                    '^https://(trac.webkit.org/changeset/|hg.mozilla.org/mozilla-central/rev/|crrev.com/|bugzil.la/|crbug.com/|webkit.org/b/)',
                                  ),
                                ),
                            )
                            .min(2),
                        ])
                        .describe(
                          'An optional changeset/commit URL for the revision which implemented the feature in the source code, or the URL to the bug tracking the implementation, for the associated browser.',
                        )
                        .optional(),
                      partial_implementation: z
                        .literal(true)
                        .describe(
                          'A boolean value indicating whether or not the implementation of the sub-feature deviates from the specification in a way that may cause compatibility problems. It defaults to false (no interoperability problems expected). If set to true, it is recommended that you add a note explaining how it diverges from the standard (such as that it implements an old version of the standard, for example).',
                        )
                        .optional(),
                      notes: z
                        .union([z.string(), z.array(z.string()).min(2)])
                        .describe(
                          'A string or array of strings containing additional information.',
                        )
                        .optional(),
                    })
                    .strict(),
                  z
                    .array(
                      z
                        .object({
                          version_added: z
                            .union([
                              z
                                .string()
                                .regex(
                                  new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$'),
                                ),
                              z.boolean().nullable(),
                            ])
                            .describe(
                              'A string (indicating which browser version added this feature), the value true (indicating support added in an unknown version), the value false (indicating the feature is not supported), or the value null (indicating support is unknown).',
                            ),
                          version_removed: z
                            .union([
                              z
                                .string()
                                .regex(
                                  new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$'),
                                ),
                              z.literal(true),
                            ])
                            .describe(
                              'A string, indicating which browser version removed this feature, or the value true, indicating that the feature was removed in an unknown version.',
                            )
                            .optional(),
                          version_last: z
                            .union([
                              z
                                .string()
                                .regex(
                                  new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$'),
                                ),
                              z.literal(true),
                            ])
                            .describe(
                              'A string, indicating the last browser version that supported this feature, or the value true, indicating that the feature was removed in an unknown version. This is automatically generated.',
                            )
                            .optional(),
                          prefix: z
                            .string()
                            .describe(
                              "A prefix to add to the sub-feature name (defaults to empty string). If applicable, leading and trailing '-' must be included.",
                            )
                            .optional(),
                          alternative_name: z
                            .string()
                            .describe(
                              'An alternative name for the feature, for cases where a feature is implemented under an entirely different name and not just prefixed.',
                            )
                            .optional(),
                          flags: z
                            .array(
                              z
                                .object({
                                  type: z
                                    .enum(['preference', 'runtime_flag'])
                                    .describe(
                                      'An enum that indicates the flag type.',
                                    ),
                                  name: z
                                    .string()
                                    .describe(
                                      'A string giving the name of the flag or preference that must be configured.',
                                    ),
                                  value_to_set: z
                                    .string()
                                    .describe(
                                      'A string giving the value which the specified flag must be set to for this feature to work.',
                                    )
                                    .optional(),
                                })
                                .strict(),
                            )
                            .min(1)
                            .describe(
                              'An optional array of objects describing flags that must be configured for this browser to support this feature.',
                            )
                            .optional(),
                          impl_url: z
                            .union([
                              z
                                .string()
                                .url()
                                .regex(
                                  new RegExp(
                                    '^https://(trac.webkit.org/changeset/|hg.mozilla.org/mozilla-central/rev/|crrev.com/|bugzil.la/|crbug.com/|webkit.org/b/)',
                                  ),
                                ),
                              z
                                .array(
                                  z
                                    .string()
                                    .url()
                                    .regex(
                                      new RegExp(
                                        '^https://(trac.webkit.org/changeset/|hg.mozilla.org/mozilla-central/rev/|crrev.com/|bugzil.la/|crbug.com/|webkit.org/b/)',
                                      ),
                                    ),
                                )
                                .min(2),
                            ])
                            .describe(
                              'An optional changeset/commit URL for the revision which implemented the feature in the source code, or the URL to the bug tracking the implementation, for the associated browser.',
                            )
                            .optional(),
                          partial_implementation: z
                            .literal(true)
                            .describe(
                              'A boolean value indicating whether or not the implementation of the sub-feature deviates from the specification in a way that may cause compatibility problems. It defaults to false (no interoperability problems expected). If set to true, it is recommended that you add a note explaining how it diverges from the standard (such as that it implements an old version of the standard, for example).',
                            )
                            .optional(),
                          notes: z
                            .union([z.string(), z.array(z.string()).min(2)])
                            .describe(
                              'A string or array of strings containing additional information.',
                            )
                            .optional(),
                        })
                        .strict(),
                    )
                    .min(2),
                  z.literal('mirror'),
                ]),
              ),
              status: z
                .object({
                  experimental: z
                    .boolean()
                    .describe(
                      'A boolean value that indicates the general stability of this feature. This value will be true if the feature was implemented in one browser engine recently. This value will be false if the feature was implemented in multiple browser engines, or if the feature had been implemented over two years ago in any one browser engine.',
                    ),
                  standard_track: z
                    .boolean()
                    .describe(
                      'A boolean value indicating whether the feature is part of an active specification or specification process.',
                    ),
                  deprecated: z
                    .boolean()
                    .describe(
                      'A boolean value that indicates whether the feature is no longer recommended. It might be removed in the future or might only be kept for compatibility purposes. Avoid using this functionality.',
                    ),
                })
                .strict()
                .optional(),
            })
            .strict()
            .optional(),
        })
        .catchall(z.union([z.any(), z.never()]))
        .superRefine((value, ctx) => {
          for (const key in value) {
            let evaluated = ['__compat'].includes(key);
            if (key.match(new RegExp('^(?!__compat)[a-zA-Z_0-9-$@]*$'))) {
              evaluated = true;
              const result = z.any().safeParse(value[key]);
              if (!result.success) {
                ctx.addIssue({
                  path: [...ctx.path, key],
                  code: 'custom',
                  message: `Invalid input: Key matching regex /${key}/ must match schema`,
                  params: {
                    issues: result.error.issues,
                  },
                });
              }
            }
            if (!evaluated) {
              const result = z.never().safeParse(value[key]);
              if (!result.success) {
                ctx.addIssue({
                  path: [...ctx.path, key],
                  code: 'custom',
                  message: `Invalid input: must match catchall schema`,
                  params: {
                    issues: result.error.issues,
                  },
                });
              }
            }
          }
        }),
      z
        .object({
          __compat: z
            .object({
              description: z
                .string()
                .describe(
                  'A string containing a human-readable description of the feature.',
                )
                .optional(),
              mdn_url: z
                .string()
                .url()
                .regex(new RegExp('^https://developer\\.mozilla\\.org/docs/'))
                .describe(
                  'A URL that points to an MDN reference page documenting the feature. The URL should be language-agnostic.',
                )
                .optional(),
              spec_url: z
                .union([
                  z
                    .string()
                    .url()
                    .regex(
                      new RegExp(
                        '(^https://[^#]+#.+)|(^https://github.com/WebAssembly/.+)|(^https://registry.khronos.org/webgl/extensions/[^/]+/)',
                      ),
                    ),
                  z
                    .array(
                      z
                        .string()
                        .url()
                        .regex(
                          new RegExp(
                            '(^https://[^#]+#.+)|(^https://github.com/WebAssembly/.+)|(^https://registry.khronos.org/webgl/extensions/[^/]+/)',
                          ),
                        ),
                    )
                    .min(2),
                ])
                .describe(
                  'An optional URL or array of URLs, each of which is for a specific part of a specification in which this feature is defined. Each URL must contain a fragment identifier.',
                )
                .optional(),
              tags: z
                .array(z.any())
                .min(1)
                .describe(
                  'An optional array of strings allowing to assign tags to the feature.',
                )
                .optional(),
              source_file: z
                .string()
                .describe(
                  'The path to the file that defines this feature in browser-compat-data, relative to the repository root. Useful for guiding potential contributors towards the correct file to edit. This is automatically generated at build time and should never manually be specified.',
                )
                .optional(),
              support: z.record(
                z.union([
                  z
                    .object({
                      version_added: z
                        .union([
                          z
                            .string()
                            .regex(
                              new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$'),
                            ),
                          z.boolean().nullable(),
                        ])
                        .describe(
                          'A string (indicating which browser version added this feature), the value true (indicating support added in an unknown version), the value false (indicating the feature is not supported), or the value null (indicating support is unknown).',
                        ),
                      version_removed: z
                        .union([
                          z
                            .string()
                            .regex(
                              new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$'),
                            ),
                          z.literal(true),
                        ])
                        .describe(
                          'A string, indicating which browser version removed this feature, or the value true, indicating that the feature was removed in an unknown version.',
                        )
                        .optional(),
                      version_last: z
                        .union([
                          z
                            .string()
                            .regex(
                              new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$'),
                            ),
                          z.literal(true),
                        ])
                        .describe(
                          'A string, indicating the last browser version that supported this feature, or the value true, indicating that the feature was removed in an unknown version. This is automatically generated.',
                        )
                        .optional(),
                      prefix: z
                        .string()
                        .describe(
                          "A prefix to add to the sub-feature name (defaults to empty string). If applicable, leading and trailing '-' must be included.",
                        )
                        .optional(),
                      alternative_name: z
                        .string()
                        .describe(
                          'An alternative name for the feature, for cases where a feature is implemented under an entirely different name and not just prefixed.',
                        )
                        .optional(),
                      flags: z
                        .array(
                          z
                            .object({
                              type: z
                                .enum(['preference', 'runtime_flag'])
                                .describe(
                                  'An enum that indicates the flag type.',
                                ),
                              name: z
                                .string()
                                .describe(
                                  'A string giving the name of the flag or preference that must be configured.',
                                ),
                              value_to_set: z
                                .string()
                                .describe(
                                  'A string giving the value which the specified flag must be set to for this feature to work.',
                                )
                                .optional(),
                            })
                            .strict(),
                        )
                        .min(1)
                        .describe(
                          'An optional array of objects describing flags that must be configured for this browser to support this feature.',
                        )
                        .optional(),
                      impl_url: z
                        .union([
                          z
                            .string()
                            .url()
                            .regex(
                              new RegExp(
                                '^https://(trac.webkit.org/changeset/|hg.mozilla.org/mozilla-central/rev/|crrev.com/|bugzil.la/|crbug.com/|webkit.org/b/)',
                              ),
                            ),
                          z
                            .array(
                              z
                                .string()
                                .url()
                                .regex(
                                  new RegExp(
                                    '^https://(trac.webkit.org/changeset/|hg.mozilla.org/mozilla-central/rev/|crrev.com/|bugzil.la/|crbug.com/|webkit.org/b/)',
                                  ),
                                ),
                            )
                            .min(2),
                        ])
                        .describe(
                          'An optional changeset/commit URL for the revision which implemented the feature in the source code, or the URL to the bug tracking the implementation, for the associated browser.',
                        )
                        .optional(),
                      partial_implementation: z
                        .literal(true)
                        .describe(
                          'A boolean value indicating whether or not the implementation of the sub-feature deviates from the specification in a way that may cause compatibility problems. It defaults to false (no interoperability problems expected). If set to true, it is recommended that you add a note explaining how it diverges from the standard (such as that it implements an old version of the standard, for example).',
                        )
                        .optional(),
                      notes: z
                        .union([z.string(), z.array(z.string()).min(2)])
                        .describe(
                          'A string or array of strings containing additional information.',
                        )
                        .optional(),
                    })
                    .strict(),
                  z
                    .array(
                      z
                        .object({
                          version_added: z
                            .union([
                              z
                                .string()
                                .regex(
                                  new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$'),
                                ),
                              z.boolean().nullable(),
                            ])
                            .describe(
                              'A string (indicating which browser version added this feature), the value true (indicating support added in an unknown version), the value false (indicating the feature is not supported), or the value null (indicating support is unknown).',
                            ),
                          version_removed: z
                            .union([
                              z
                                .string()
                                .regex(
                                  new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$'),
                                ),
                              z.literal(true),
                            ])
                            .describe(
                              'A string, indicating which browser version removed this feature, or the value true, indicating that the feature was removed in an unknown version.',
                            )
                            .optional(),
                          version_last: z
                            .union([
                              z
                                .string()
                                .regex(
                                  new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$'),
                                ),
                              z.literal(true),
                            ])
                            .describe(
                              'A string, indicating the last browser version that supported this feature, or the value true, indicating that the feature was removed in an unknown version. This is automatically generated.',
                            )
                            .optional(),
                          prefix: z
                            .string()
                            .describe(
                              "A prefix to add to the sub-feature name (defaults to empty string). If applicable, leading and trailing '-' must be included.",
                            )
                            .optional(),
                          alternative_name: z
                            .string()
                            .describe(
                              'An alternative name for the feature, for cases where a feature is implemented under an entirely different name and not just prefixed.',
                            )
                            .optional(),
                          flags: z
                            .array(
                              z
                                .object({
                                  type: z
                                    .enum(['preference', 'runtime_flag'])
                                    .describe(
                                      'An enum that indicates the flag type.',
                                    ),
                                  name: z
                                    .string()
                                    .describe(
                                      'A string giving the name of the flag or preference that must be configured.',
                                    ),
                                  value_to_set: z
                                    .string()
                                    .describe(
                                      'A string giving the value which the specified flag must be set to for this feature to work.',
                                    )
                                    .optional(),
                                })
                                .strict(),
                            )
                            .min(1)
                            .describe(
                              'An optional array of objects describing flags that must be configured for this browser to support this feature.',
                            )
                            .optional(),
                          impl_url: z
                            .union([
                              z
                                .string()
                                .url()
                                .regex(
                                  new RegExp(
                                    '^https://(trac.webkit.org/changeset/|hg.mozilla.org/mozilla-central/rev/|crrev.com/|bugzil.la/|crbug.com/|webkit.org/b/)',
                                  ),
                                ),
                              z
                                .array(
                                  z
                                    .string()
                                    .url()
                                    .regex(
                                      new RegExp(
                                        '^https://(trac.webkit.org/changeset/|hg.mozilla.org/mozilla-central/rev/|crrev.com/|bugzil.la/|crbug.com/|webkit.org/b/)',
                                      ),
                                    ),
                                )
                                .min(2),
                            ])
                            .describe(
                              'An optional changeset/commit URL for the revision which implemented the feature in the source code, or the URL to the bug tracking the implementation, for the associated browser.',
                            )
                            .optional(),
                          partial_implementation: z
                            .literal(true)
                            .describe(
                              'A boolean value indicating whether or not the implementation of the sub-feature deviates from the specification in a way that may cause compatibility problems. It defaults to false (no interoperability problems expected). If set to true, it is recommended that you add a note explaining how it diverges from the standard (such as that it implements an old version of the standard, for example).',
                            )
                            .optional(),
                          notes: z
                            .union([z.string(), z.array(z.string()).min(2)])
                            .describe(
                              'A string or array of strings containing additional information.',
                            )
                            .optional(),
                        })
                        .strict(),
                    )
                    .min(2),
                  z.literal('mirror'),
                ]),
              ),
              status: z
                .object({
                  experimental: z
                    .boolean()
                    .describe(
                      'A boolean value that indicates the general stability of this feature. This value will be true if the feature was implemented in one browser engine recently. This value will be false if the feature was implemented in multiple browser engines, or if the feature had been implemented over two years ago in any one browser engine.',
                    ),
                  standard_track: z
                    .boolean()
                    .describe(
                      'A boolean value indicating whether the feature is part of an active specification or specification process.',
                    ),
                  deprecated: z
                    .boolean()
                    .describe(
                      'A boolean value that indicates whether the feature is no longer recommended. It might be removed in the future or might only be kept for compatibility purposes. Avoid using this functionality.',
                    ),
                })
                .strict()
                .optional(),
            })
            .strict()
            .optional(),
        })
        .catchall(z.union([z.any(), z.never()]))
        .superRefine((value, ctx) => {
          for (const key in value) {
            let evaluated = ['__compat'].includes(key);
            if (key.match(new RegExp('^(?!__compat)[a-zA-Z_0-9-$@]*$'))) {
              evaluated = true;
              const result = z.any().safeParse(value[key]);
              if (!result.success) {
                ctx.addIssue({
                  path: [...ctx.path, key],
                  code: 'custom',
                  message: `Invalid input: Key matching regex /${key}/ must match schema`,
                  params: {
                    issues: result.error.issues,
                  },
                });
              }
            }
            if (!evaluated) {
              const result = z.never().safeParse(value[key]);
              if (!result.success) {
                ctx.addIssue({
                  path: [...ctx.path, key],
                  code: 'custom',
                  message: `Invalid input: must match catchall schema`,
                  params: {
                    issues: result.error.issues,
                  },
                });
              }
            }
          }
        }),
      z
        .object({
          description: z
            .string()
            .describe(
              'A string containing a human-readable description of the feature.',
            )
            .optional(),
          mdn_url: z
            .string()
            .url()
            .regex(new RegExp('^https://developer\\.mozilla\\.org/docs/'))
            .describe(
              'A URL that points to an MDN reference page documenting the feature. The URL should be language-agnostic.',
            )
            .optional(),
          spec_url: z
            .union([
              z
                .string()
                .url()
                .regex(
                  new RegExp(
                    '(^https://[^#]+#.+)|(^https://github.com/WebAssembly/.+)|(^https://registry.khronos.org/webgl/extensions/[^/]+/)',
                  ),
                ),
              z
                .array(
                  z
                    .string()
                    .url()
                    .regex(
                      new RegExp(
                        '(^https://[^#]+#.+)|(^https://github.com/WebAssembly/.+)|(^https://registry.khronos.org/webgl/extensions/[^/]+/)',
                      ),
                    ),
                )
                .min(2),
            ])
            .describe(
              'An optional URL or array of URLs, each of which is for a specific part of a specification in which this feature is defined. Each URL must contain a fragment identifier.',
            )
            .optional(),
          tags: z
            .array(z.any())
            .min(1)
            .describe(
              'An optional array of strings allowing to assign tags to the feature.',
            )
            .optional(),
          source_file: z
            .string()
            .describe(
              'The path to the file that defines this feature in browser-compat-data, relative to the repository root. Useful for guiding potential contributors towards the correct file to edit. This is automatically generated at build time and should never manually be specified.',
            )
            .optional(),
          support: z.record(
            z.union([
              z
                .object({
                  version_added: z
                    .union([
                      z
                        .string()
                        .regex(new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$')),
                      z.boolean().nullable(),
                    ])
                    .describe(
                      'A string (indicating which browser version added this feature), the value true (indicating support added in an unknown version), the value false (indicating the feature is not supported), or the value null (indicating support is unknown).',
                    ),
                  version_removed: z
                    .union([
                      z
                        .string()
                        .regex(new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$')),
                      z.literal(true),
                    ])
                    .describe(
                      'A string, indicating which browser version removed this feature, or the value true, indicating that the feature was removed in an unknown version.',
                    )
                    .optional(),
                  version_last: z
                    .union([
                      z
                        .string()
                        .regex(new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$')),
                      z.literal(true),
                    ])
                    .describe(
                      'A string, indicating the last browser version that supported this feature, or the value true, indicating that the feature was removed in an unknown version. This is automatically generated.',
                    )
                    .optional(),
                  prefix: z
                    .string()
                    .describe(
                      "A prefix to add to the sub-feature name (defaults to empty string). If applicable, leading and trailing '-' must be included.",
                    )
                    .optional(),
                  alternative_name: z
                    .string()
                    .describe(
                      'An alternative name for the feature, for cases where a feature is implemented under an entirely different name and not just prefixed.',
                    )
                    .optional(),
                  flags: z
                    .array(
                      z
                        .object({
                          type: z
                            .enum(['preference', 'runtime_flag'])
                            .describe('An enum that indicates the flag type.'),
                          name: z
                            .string()
                            .describe(
                              'A string giving the name of the flag or preference that must be configured.',
                            ),
                          value_to_set: z
                            .string()
                            .describe(
                              'A string giving the value which the specified flag must be set to for this feature to work.',
                            )
                            .optional(),
                        })
                        .strict(),
                    )
                    .min(1)
                    .describe(
                      'An optional array of objects describing flags that must be configured for this browser to support this feature.',
                    )
                    .optional(),
                  impl_url: z
                    .union([
                      z
                        .string()
                        .url()
                        .regex(
                          new RegExp(
                            '^https://(trac.webkit.org/changeset/|hg.mozilla.org/mozilla-central/rev/|crrev.com/|bugzil.la/|crbug.com/|webkit.org/b/)',
                          ),
                        ),
                      z
                        .array(
                          z
                            .string()
                            .url()
                            .regex(
                              new RegExp(
                                '^https://(trac.webkit.org/changeset/|hg.mozilla.org/mozilla-central/rev/|crrev.com/|bugzil.la/|crbug.com/|webkit.org/b/)',
                              ),
                            ),
                        )
                        .min(2),
                    ])
                    .describe(
                      'An optional changeset/commit URL for the revision which implemented the feature in the source code, or the URL to the bug tracking the implementation, for the associated browser.',
                    )
                    .optional(),
                  partial_implementation: z
                    .literal(true)
                    .describe(
                      'A boolean value indicating whether or not the implementation of the sub-feature deviates from the specification in a way that may cause compatibility problems. It defaults to false (no interoperability problems expected). If set to true, it is recommended that you add a note explaining how it diverges from the standard (such as that it implements an old version of the standard, for example).',
                    )
                    .optional(),
                  notes: z
                    .union([z.string(), z.array(z.string()).min(2)])
                    .describe(
                      'A string or array of strings containing additional information.',
                    )
                    .optional(),
                })
                .strict(),
              z
                .array(
                  z
                    .object({
                      version_added: z
                        .union([
                          z
                            .string()
                            .regex(
                              new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$'),
                            ),
                          z.boolean().nullable(),
                        ])
                        .describe(
                          'A string (indicating which browser version added this feature), the value true (indicating support added in an unknown version), the value false (indicating the feature is not supported), or the value null (indicating support is unknown).',
                        ),
                      version_removed: z
                        .union([
                          z
                            .string()
                            .regex(
                              new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$'),
                            ),
                          z.literal(true),
                        ])
                        .describe(
                          'A string, indicating which browser version removed this feature, or the value true, indicating that the feature was removed in an unknown version.',
                        )
                        .optional(),
                      version_last: z
                        .union([
                          z
                            .string()
                            .regex(
                              new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$'),
                            ),
                          z.literal(true),
                        ])
                        .describe(
                          'A string, indicating the last browser version that supported this feature, or the value true, indicating that the feature was removed in an unknown version. This is automatically generated.',
                        )
                        .optional(),
                      prefix: z
                        .string()
                        .describe(
                          "A prefix to add to the sub-feature name (defaults to empty string). If applicable, leading and trailing '-' must be included.",
                        )
                        .optional(),
                      alternative_name: z
                        .string()
                        .describe(
                          'An alternative name for the feature, for cases where a feature is implemented under an entirely different name and not just prefixed.',
                        )
                        .optional(),
                      flags: z
                        .array(
                          z
                            .object({
                              type: z
                                .enum(['preference', 'runtime_flag'])
                                .describe(
                                  'An enum that indicates the flag type.',
                                ),
                              name: z
                                .string()
                                .describe(
                                  'A string giving the name of the flag or preference that must be configured.',
                                ),
                              value_to_set: z
                                .string()
                                .describe(
                                  'A string giving the value which the specified flag must be set to for this feature to work.',
                                )
                                .optional(),
                            })
                            .strict(),
                        )
                        .min(1)
                        .describe(
                          'An optional array of objects describing flags that must be configured for this browser to support this feature.',
                        )
                        .optional(),
                      impl_url: z
                        .union([
                          z
                            .string()
                            .url()
                            .regex(
                              new RegExp(
                                '^https://(trac.webkit.org/changeset/|hg.mozilla.org/mozilla-central/rev/|crrev.com/|bugzil.la/|crbug.com/|webkit.org/b/)',
                              ),
                            ),
                          z
                            .array(
                              z
                                .string()
                                .url()
                                .regex(
                                  new RegExp(
                                    '^https://(trac.webkit.org/changeset/|hg.mozilla.org/mozilla-central/rev/|crrev.com/|bugzil.la/|crbug.com/|webkit.org/b/)',
                                  ),
                                ),
                            )
                            .min(2),
                        ])
                        .describe(
                          'An optional changeset/commit URL for the revision which implemented the feature in the source code, or the URL to the bug tracking the implementation, for the associated browser.',
                        )
                        .optional(),
                      partial_implementation: z
                        .literal(true)
                        .describe(
                          'A boolean value indicating whether or not the implementation of the sub-feature deviates from the specification in a way that may cause compatibility problems. It defaults to false (no interoperability problems expected). If set to true, it is recommended that you add a note explaining how it diverges from the standard (such as that it implements an old version of the standard, for example).',
                        )
                        .optional(),
                      notes: z
                        .union([z.string(), z.array(z.string()).min(2)])
                        .describe(
                          'A string or array of strings containing additional information.',
                        )
                        .optional(),
                    })
                    .strict(),
                )
                .min(2),
              z.literal('mirror'),
            ]),
          ),
          status: z
            .object({
              experimental: z
                .boolean()
                .describe(
                  'A boolean value that indicates the general stability of this feature. This value will be true if the feature was implemented in one browser engine recently. This value will be false if the feature was implemented in multiple browser engines, or if the feature had been implemented over two years ago in any one browser engine.',
                ),
              standard_track: z
                .boolean()
                .describe(
                  'A boolean value indicating whether the feature is part of an active specification or specification process.',
                ),
              deprecated: z
                .boolean()
                .describe(
                  'A boolean value that indicates whether the feature is no longer recommended. It might be removed in the future or might only be kept for compatibility purposes. Avoid using this functionality.',
                ),
            })
            .strict()
            .optional(),
        })
        .strict(),
      z.never(),
    ]),
  )
  .superRefine((value, ctx) => {
    for (const key in value) {
      let evaluated = false;
      if (
        key.match(new RegExp('^(?!__compat)(?!webextensions)[a-zA-Z_0-9-$@]*$'))
      ) {
        evaluated = true;
        const result = z
          .object({
            __compat: z
              .object({
                description: z
                  .string()
                  .describe(
                    'A string containing a human-readable description of the feature.',
                  )
                  .optional(),
                mdn_url: z
                  .string()
                  .url()
                  .regex(new RegExp('^https://developer\\.mozilla\\.org/docs/'))
                  .describe(
                    'A URL that points to an MDN reference page documenting the feature. The URL should be language-agnostic.',
                  )
                  .optional(),
                spec_url: z
                  .union([
                    z
                      .string()
                      .url()
                      .regex(
                        new RegExp(
                          '(^https://[^#]+#.+)|(^https://github.com/WebAssembly/.+)|(^https://registry.khronos.org/webgl/extensions/[^/]+/)',
                        ),
                      ),
                    z
                      .array(
                        z
                          .string()
                          .url()
                          .regex(
                            new RegExp(
                              '(^https://[^#]+#.+)|(^https://github.com/WebAssembly/.+)|(^https://registry.khronos.org/webgl/extensions/[^/]+/)',
                            ),
                          ),
                      )
                      .min(2),
                  ])
                  .describe(
                    'An optional URL or array of URLs, each of which is for a specific part of a specification in which this feature is defined. Each URL must contain a fragment identifier.',
                  )
                  .optional(),
                tags: z
                  .array(z.any())
                  .min(1)
                  .describe(
                    'An optional array of strings allowing to assign tags to the feature.',
                  )
                  .optional(),
                source_file: z
                  .string()
                  .describe(
                    'The path to the file that defines this feature in browser-compat-data, relative to the repository root. Useful for guiding potential contributors towards the correct file to edit. This is automatically generated at build time and should never manually be specified.',
                  )
                  .optional(),
                support: z.record(
                  z.union([
                    z
                      .object({
                        version_added: z
                          .union([
                            z
                              .string()
                              .regex(
                                new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$'),
                              ),
                            z.boolean().nullable(),
                          ])
                          .describe(
                            'A string (indicating which browser version added this feature), the value true (indicating support added in an unknown version), the value false (indicating the feature is not supported), or the value null (indicating support is unknown).',
                          ),
                        version_removed: z
                          .union([
                            z
                              .string()
                              .regex(
                                new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$'),
                              ),
                            z.literal(true),
                          ])
                          .describe(
                            'A string, indicating which browser version removed this feature, or the value true, indicating that the feature was removed in an unknown version.',
                          )
                          .optional(),
                        version_last: z
                          .union([
                            z
                              .string()
                              .regex(
                                new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$'),
                              ),
                            z.literal(true),
                          ])
                          .describe(
                            'A string, indicating the last browser version that supported this feature, or the value true, indicating that the feature was removed in an unknown version. This is automatically generated.',
                          )
                          .optional(),
                        prefix: z
                          .string()
                          .describe(
                            "A prefix to add to the sub-feature name (defaults to empty string). If applicable, leading and trailing '-' must be included.",
                          )
                          .optional(),
                        alternative_name: z
                          .string()
                          .describe(
                            'An alternative name for the feature, for cases where a feature is implemented under an entirely different name and not just prefixed.',
                          )
                          .optional(),
                        flags: z
                          .array(
                            z
                              .object({
                                type: z
                                  .enum(['preference', 'runtime_flag'])
                                  .describe(
                                    'An enum that indicates the flag type.',
                                  ),
                                name: z
                                  .string()
                                  .describe(
                                    'A string giving the name of the flag or preference that must be configured.',
                                  ),
                                value_to_set: z
                                  .string()
                                  .describe(
                                    'A string giving the value which the specified flag must be set to for this feature to work.',
                                  )
                                  .optional(),
                              })
                              .strict(),
                          )
                          .min(1)
                          .describe(
                            'An optional array of objects describing flags that must be configured for this browser to support this feature.',
                          )
                          .optional(),
                        impl_url: z
                          .union([
                            z
                              .string()
                              .url()
                              .regex(
                                new RegExp(
                                  '^https://(trac.webkit.org/changeset/|hg.mozilla.org/mozilla-central/rev/|crrev.com/|bugzil.la/|crbug.com/|webkit.org/b/)',
                                ),
                              ),
                            z
                              .array(
                                z
                                  .string()
                                  .url()
                                  .regex(
                                    new RegExp(
                                      '^https://(trac.webkit.org/changeset/|hg.mozilla.org/mozilla-central/rev/|crrev.com/|bugzil.la/|crbug.com/|webkit.org/b/)',
                                    ),
                                  ),
                              )
                              .min(2),
                          ])
                          .describe(
                            'An optional changeset/commit URL for the revision which implemented the feature in the source code, or the URL to the bug tracking the implementation, for the associated browser.',
                          )
                          .optional(),
                        partial_implementation: z
                          .literal(true)
                          .describe(
                            'A boolean value indicating whether or not the implementation of the sub-feature deviates from the specification in a way that may cause compatibility problems. It defaults to false (no interoperability problems expected). If set to true, it is recommended that you add a note explaining how it diverges from the standard (such as that it implements an old version of the standard, for example).',
                          )
                          .optional(),
                        notes: z
                          .union([z.string(), z.array(z.string()).min(2)])
                          .describe(
                            'A string or array of strings containing additional information.',
                          )
                          .optional(),
                      })
                      .strict(),
                    z
                      .array(
                        z
                          .object({
                            version_added: z
                              .union([
                                z
                                  .string()
                                  .regex(
                                    new RegExp(
                                      '^(≤?(\\d+)(\\.\\d+)*|preview)$',
                                    ),
                                  ),
                                z.boolean().nullable(),
                              ])
                              .describe(
                                'A string (indicating which browser version added this feature), the value true (indicating support added in an unknown version), the value false (indicating the feature is not supported), or the value null (indicating support is unknown).',
                              ),
                            version_removed: z
                              .union([
                                z
                                  .string()
                                  .regex(
                                    new RegExp(
                                      '^(≤?(\\d+)(\\.\\d+)*|preview)$',
                                    ),
                                  ),
                                z.literal(true),
                              ])
                              .describe(
                                'A string, indicating which browser version removed this feature, or the value true, indicating that the feature was removed in an unknown version.',
                              )
                              .optional(),
                            version_last: z
                              .union([
                                z
                                  .string()
                                  .regex(
                                    new RegExp(
                                      '^(≤?(\\d+)(\\.\\d+)*|preview)$',
                                    ),
                                  ),
                                z.literal(true),
                              ])
                              .describe(
                                'A string, indicating the last browser version that supported this feature, or the value true, indicating that the feature was removed in an unknown version. This is automatically generated.',
                              )
                              .optional(),
                            prefix: z
                              .string()
                              .describe(
                                "A prefix to add to the sub-feature name (defaults to empty string). If applicable, leading and trailing '-' must be included.",
                              )
                              .optional(),
                            alternative_name: z
                              .string()
                              .describe(
                                'An alternative name for the feature, for cases where a feature is implemented under an entirely different name and not just prefixed.',
                              )
                              .optional(),
                            flags: z
                              .array(
                                z
                                  .object({
                                    type: z
                                      .enum(['preference', 'runtime_flag'])
                                      .describe(
                                        'An enum that indicates the flag type.',
                                      ),
                                    name: z
                                      .string()
                                      .describe(
                                        'A string giving the name of the flag or preference that must be configured.',
                                      ),
                                    value_to_set: z
                                      .string()
                                      .describe(
                                        'A string giving the value which the specified flag must be set to for this feature to work.',
                                      )
                                      .optional(),
                                  })
                                  .strict(),
                              )
                              .min(1)
                              .describe(
                                'An optional array of objects describing flags that must be configured for this browser to support this feature.',
                              )
                              .optional(),
                            impl_url: z
                              .union([
                                z
                                  .string()
                                  .url()
                                  .regex(
                                    new RegExp(
                                      '^https://(trac.webkit.org/changeset/|hg.mozilla.org/mozilla-central/rev/|crrev.com/|bugzil.la/|crbug.com/|webkit.org/b/)',
                                    ),
                                  ),
                                z
                                  .array(
                                    z
                                      .string()
                                      .url()
                                      .regex(
                                        new RegExp(
                                          '^https://(trac.webkit.org/changeset/|hg.mozilla.org/mozilla-central/rev/|crrev.com/|bugzil.la/|crbug.com/|webkit.org/b/)',
                                        ),
                                      ),
                                  )
                                  .min(2),
                              ])
                              .describe(
                                'An optional changeset/commit URL for the revision which implemented the feature in the source code, or the URL to the bug tracking the implementation, for the associated browser.',
                              )
                              .optional(),
                            partial_implementation: z
                              .literal(true)
                              .describe(
                                'A boolean value indicating whether or not the implementation of the sub-feature deviates from the specification in a way that may cause compatibility problems. It defaults to false (no interoperability problems expected). If set to true, it is recommended that you add a note explaining how it diverges from the standard (such as that it implements an old version of the standard, for example).',
                              )
                              .optional(),
                            notes: z
                              .union([z.string(), z.array(z.string()).min(2)])
                              .describe(
                                'A string or array of strings containing additional information.',
                              )
                              .optional(),
                          })
                          .strict(),
                      )
                      .min(2),
                    z.literal('mirror'),
                  ]),
                ),
                status: z
                  .object({
                    experimental: z
                      .boolean()
                      .describe(
                        'A boolean value that indicates the general stability of this feature. This value will be true if the feature was implemented in one browser engine recently. This value will be false if the feature was implemented in multiple browser engines, or if the feature had been implemented over two years ago in any one browser engine.',
                      ),
                    standard_track: z
                      .boolean()
                      .describe(
                        'A boolean value indicating whether the feature is part of an active specification or specification process.',
                      ),
                    deprecated: z
                      .boolean()
                      .describe(
                        'A boolean value that indicates whether the feature is no longer recommended. It might be removed in the future or might only be kept for compatibility purposes. Avoid using this functionality.',
                      ),
                  })
                  .strict()
                  .optional(),
              })
              .strict()
              .optional(),
          })
          .catchall(z.union([z.any(), z.never()]))
          .superRefine((value, ctx) => {
            for (const key in value) {
              let evaluated = ['__compat'].includes(key);
              if (key.match(new RegExp('^(?!__compat)[a-zA-Z_0-9-$@]*$'))) {
                evaluated = true;
                const result = z.any().safeParse(value[key]);
                if (!result.success) {
                  ctx.addIssue({
                    path: [...ctx.path, key],
                    code: 'custom',
                    message: `Invalid input: Key matching regex /${key}/ must match schema`,
                    params: {
                      issues: result.error.issues,
                    },
                  });
                }
              }
              if (!evaluated) {
                const result = z.never().safeParse(value[key]);
                if (!result.success) {
                  ctx.addIssue({
                    path: [...ctx.path, key],
                    code: 'custom',
                    message: `Invalid input: must match catchall schema`,
                    params: {
                      issues: result.error.issues,
                    },
                  });
                }
              }
            }
          })
          .safeParse(value[key]);
        if (!result.success) {
          ctx.addIssue({
            path: [...ctx.path, key],
            code: 'custom',
            message: `Invalid input: Key matching regex /${key}/ must match schema`,
            params: {
              issues: result.error.issues,
            },
          });
        }
      }
      if (key.match(new RegExp('^webextensions*$'))) {
        evaluated = true;
        const result = z
          .object({
            __compat: z
              .object({
                description: z
                  .string()
                  .describe(
                    'A string containing a human-readable description of the feature.',
                  )
                  .optional(),
                mdn_url: z
                  .string()
                  .url()
                  .regex(new RegExp('^https://developer\\.mozilla\\.org/docs/'))
                  .describe(
                    'A URL that points to an MDN reference page documenting the feature. The URL should be language-agnostic.',
                  )
                  .optional(),
                spec_url: z
                  .union([
                    z
                      .string()
                      .url()
                      .regex(
                        new RegExp(
                          '(^https://[^#]+#.+)|(^https://github.com/WebAssembly/.+)|(^https://registry.khronos.org/webgl/extensions/[^/]+/)',
                        ),
                      ),
                    z
                      .array(
                        z
                          .string()
                          .url()
                          .regex(
                            new RegExp(
                              '(^https://[^#]+#.+)|(^https://github.com/WebAssembly/.+)|(^https://registry.khronos.org/webgl/extensions/[^/]+/)',
                            ),
                          ),
                      )
                      .min(2),
                  ])
                  .describe(
                    'An optional URL or array of URLs, each of which is for a specific part of a specification in which this feature is defined. Each URL must contain a fragment identifier.',
                  )
                  .optional(),
                tags: z
                  .array(z.any())
                  .min(1)
                  .describe(
                    'An optional array of strings allowing to assign tags to the feature.',
                  )
                  .optional(),
                source_file: z
                  .string()
                  .describe(
                    'The path to the file that defines this feature in browser-compat-data, relative to the repository root. Useful for guiding potential contributors towards the correct file to edit. This is automatically generated at build time and should never manually be specified.',
                  )
                  .optional(),
                support: z.record(
                  z.union([
                    z
                      .object({
                        version_added: z
                          .union([
                            z
                              .string()
                              .regex(
                                new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$'),
                              ),
                            z.boolean().nullable(),
                          ])
                          .describe(
                            'A string (indicating which browser version added this feature), the value true (indicating support added in an unknown version), the value false (indicating the feature is not supported), or the value null (indicating support is unknown).',
                          ),
                        version_removed: z
                          .union([
                            z
                              .string()
                              .regex(
                                new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$'),
                              ),
                            z.literal(true),
                          ])
                          .describe(
                            'A string, indicating which browser version removed this feature, or the value true, indicating that the feature was removed in an unknown version.',
                          )
                          .optional(),
                        version_last: z
                          .union([
                            z
                              .string()
                              .regex(
                                new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$'),
                              ),
                            z.literal(true),
                          ])
                          .describe(
                            'A string, indicating the last browser version that supported this feature, or the value true, indicating that the feature was removed in an unknown version. This is automatically generated.',
                          )
                          .optional(),
                        prefix: z
                          .string()
                          .describe(
                            "A prefix to add to the sub-feature name (defaults to empty string). If applicable, leading and trailing '-' must be included.",
                          )
                          .optional(),
                        alternative_name: z
                          .string()
                          .describe(
                            'An alternative name for the feature, for cases where a feature is implemented under an entirely different name and not just prefixed.',
                          )
                          .optional(),
                        flags: z
                          .array(
                            z
                              .object({
                                type: z
                                  .enum(['preference', 'runtime_flag'])
                                  .describe(
                                    'An enum that indicates the flag type.',
                                  ),
                                name: z
                                  .string()
                                  .describe(
                                    'A string giving the name of the flag or preference that must be configured.',
                                  ),
                                value_to_set: z
                                  .string()
                                  .describe(
                                    'A string giving the value which the specified flag must be set to for this feature to work.',
                                  )
                                  .optional(),
                              })
                              .strict(),
                          )
                          .min(1)
                          .describe(
                            'An optional array of objects describing flags that must be configured for this browser to support this feature.',
                          )
                          .optional(),
                        impl_url: z
                          .union([
                            z
                              .string()
                              .url()
                              .regex(
                                new RegExp(
                                  '^https://(trac.webkit.org/changeset/|hg.mozilla.org/mozilla-central/rev/|crrev.com/|bugzil.la/|crbug.com/|webkit.org/b/)',
                                ),
                              ),
                            z
                              .array(
                                z
                                  .string()
                                  .url()
                                  .regex(
                                    new RegExp(
                                      '^https://(trac.webkit.org/changeset/|hg.mozilla.org/mozilla-central/rev/|crrev.com/|bugzil.la/|crbug.com/|webkit.org/b/)',
                                    ),
                                  ),
                              )
                              .min(2),
                          ])
                          .describe(
                            'An optional changeset/commit URL for the revision which implemented the feature in the source code, or the URL to the bug tracking the implementation, for the associated browser.',
                          )
                          .optional(),
                        partial_implementation: z
                          .literal(true)
                          .describe(
                            'A boolean value indicating whether or not the implementation of the sub-feature deviates from the specification in a way that may cause compatibility problems. It defaults to false (no interoperability problems expected). If set to true, it is recommended that you add a note explaining how it diverges from the standard (such as that it implements an old version of the standard, for example).',
                          )
                          .optional(),
                        notes: z
                          .union([z.string(), z.array(z.string()).min(2)])
                          .describe(
                            'A string or array of strings containing additional information.',
                          )
                          .optional(),
                      })
                      .strict(),
                    z
                      .array(
                        z
                          .object({
                            version_added: z
                              .union([
                                z
                                  .string()
                                  .regex(
                                    new RegExp(
                                      '^(≤?(\\d+)(\\.\\d+)*|preview)$',
                                    ),
                                  ),
                                z.boolean().nullable(),
                              ])
                              .describe(
                                'A string (indicating which browser version added this feature), the value true (indicating support added in an unknown version), the value false (indicating the feature is not supported), or the value null (indicating support is unknown).',
                              ),
                            version_removed: z
                              .union([
                                z
                                  .string()
                                  .regex(
                                    new RegExp(
                                      '^(≤?(\\d+)(\\.\\d+)*|preview)$',
                                    ),
                                  ),
                                z.literal(true),
                              ])
                              .describe(
                                'A string, indicating which browser version removed this feature, or the value true, indicating that the feature was removed in an unknown version.',
                              )
                              .optional(),
                            version_last: z
                              .union([
                                z
                                  .string()
                                  .regex(
                                    new RegExp(
                                      '^(≤?(\\d+)(\\.\\d+)*|preview)$',
                                    ),
                                  ),
                                z.literal(true),
                              ])
                              .describe(
                                'A string, indicating the last browser version that supported this feature, or the value true, indicating that the feature was removed in an unknown version. This is automatically generated.',
                              )
                              .optional(),
                            prefix: z
                              .string()
                              .describe(
                                "A prefix to add to the sub-feature name (defaults to empty string). If applicable, leading and trailing '-' must be included.",
                              )
                              .optional(),
                            alternative_name: z
                              .string()
                              .describe(
                                'An alternative name for the feature, for cases where a feature is implemented under an entirely different name and not just prefixed.',
                              )
                              .optional(),
                            flags: z
                              .array(
                                z
                                  .object({
                                    type: z
                                      .enum(['preference', 'runtime_flag'])
                                      .describe(
                                        'An enum that indicates the flag type.',
                                      ),
                                    name: z
                                      .string()
                                      .describe(
                                        'A string giving the name of the flag or preference that must be configured.',
                                      ),
                                    value_to_set: z
                                      .string()
                                      .describe(
                                        'A string giving the value which the specified flag must be set to for this feature to work.',
                                      )
                                      .optional(),
                                  })
                                  .strict(),
                              )
                              .min(1)
                              .describe(
                                'An optional array of objects describing flags that must be configured for this browser to support this feature.',
                              )
                              .optional(),
                            impl_url: z
                              .union([
                                z
                                  .string()
                                  .url()
                                  .regex(
                                    new RegExp(
                                      '^https://(trac.webkit.org/changeset/|hg.mozilla.org/mozilla-central/rev/|crrev.com/|bugzil.la/|crbug.com/|webkit.org/b/)',
                                    ),
                                  ),
                                z
                                  .array(
                                    z
                                      .string()
                                      .url()
                                      .regex(
                                        new RegExp(
                                          '^https://(trac.webkit.org/changeset/|hg.mozilla.org/mozilla-central/rev/|crrev.com/|bugzil.la/|crbug.com/|webkit.org/b/)',
                                        ),
                                      ),
                                  )
                                  .min(2),
                              ])
                              .describe(
                                'An optional changeset/commit URL for the revision which implemented the feature in the source code, or the URL to the bug tracking the implementation, for the associated browser.',
                              )
                              .optional(),
                            partial_implementation: z
                              .literal(true)
                              .describe(
                                'A boolean value indicating whether or not the implementation of the sub-feature deviates from the specification in a way that may cause compatibility problems. It defaults to false (no interoperability problems expected). If set to true, it is recommended that you add a note explaining how it diverges from the standard (such as that it implements an old version of the standard, for example).',
                              )
                              .optional(),
                            notes: z
                              .union([z.string(), z.array(z.string()).min(2)])
                              .describe(
                                'A string or array of strings containing additional information.',
                              )
                              .optional(),
                          })
                          .strict(),
                      )
                      .min(2),
                    z.literal('mirror'),
                  ]),
                ),
                status: z
                  .object({
                    experimental: z
                      .boolean()
                      .describe(
                        'A boolean value that indicates the general stability of this feature. This value will be true if the feature was implemented in one browser engine recently. This value will be false if the feature was implemented in multiple browser engines, or if the feature had been implemented over two years ago in any one browser engine.',
                      ),
                    standard_track: z
                      .boolean()
                      .describe(
                        'A boolean value indicating whether the feature is part of an active specification or specification process.',
                      ),
                    deprecated: z
                      .boolean()
                      .describe(
                        'A boolean value that indicates whether the feature is no longer recommended. It might be removed in the future or might only be kept for compatibility purposes. Avoid using this functionality.',
                      ),
                  })
                  .strict()
                  .optional(),
              })
              .strict()
              .optional(),
          })
          .catchall(z.union([z.any(), z.never()]))
          .superRefine((value, ctx) => {
            for (const key in value) {
              let evaluated = ['__compat'].includes(key);
              if (key.match(new RegExp('^(?!__compat)[a-zA-Z_0-9-$@]*$'))) {
                evaluated = true;
                const result = z.any().safeParse(value[key]);
                if (!result.success) {
                  ctx.addIssue({
                    path: [...ctx.path, key],
                    code: 'custom',
                    message: `Invalid input: Key matching regex /${key}/ must match schema`,
                    params: {
                      issues: result.error.issues,
                    },
                  });
                }
              }
              if (!evaluated) {
                const result = z.never().safeParse(value[key]);
                if (!result.success) {
                  ctx.addIssue({
                    path: [...ctx.path, key],
                    code: 'custom',
                    message: `Invalid input: must match catchall schema`,
                    params: {
                      issues: result.error.issues,
                    },
                  });
                }
              }
            }
          })
          .safeParse(value[key]);
        if (!result.success) {
          ctx.addIssue({
            path: [...ctx.path, key],
            code: 'custom',
            message: `Invalid input: Key matching regex /${key}/ must match schema`,
            params: {
              issues: result.error.issues,
            },
          });
        }
      }
      if (key.match(new RegExp('^__compat$'))) {
        evaluated = true;
        const result = z
          .object({
            description: z
              .string()
              .describe(
                'A string containing a human-readable description of the feature.',
              )
              .optional(),
            mdn_url: z
              .string()
              .url()
              .regex(new RegExp('^https://developer\\.mozilla\\.org/docs/'))
              .describe(
                'A URL that points to an MDN reference page documenting the feature. The URL should be language-agnostic.',
              )
              .optional(),
            spec_url: z
              .union([
                z
                  .string()
                  .url()
                  .regex(
                    new RegExp(
                      '(^https://[^#]+#.+)|(^https://github.com/WebAssembly/.+)|(^https://registry.khronos.org/webgl/extensions/[^/]+/)',
                    ),
                  ),
                z
                  .array(
                    z
                      .string()
                      .url()
                      .regex(
                        new RegExp(
                          '(^https://[^#]+#.+)|(^https://github.com/WebAssembly/.+)|(^https://registry.khronos.org/webgl/extensions/[^/]+/)',
                        ),
                      ),
                  )
                  .min(2),
              ])
              .describe(
                'An optional URL or array of URLs, each of which is for a specific part of a specification in which this feature is defined. Each URL must contain a fragment identifier.',
              )
              .optional(),
            tags: z
              .array(z.any())
              .min(1)
              .describe(
                'An optional array of strings allowing to assign tags to the feature.',
              )
              .optional(),
            source_file: z
              .string()
              .describe(
                'The path to the file that defines this feature in browser-compat-data, relative to the repository root. Useful for guiding potential contributors towards the correct file to edit. This is automatically generated at build time and should never manually be specified.',
              )
              .optional(),
            support: z.record(
              z.union([
                z
                  .object({
                    version_added: z
                      .union([
                        z
                          .string()
                          .regex(new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$')),
                        z.boolean().nullable(),
                      ])
                      .describe(
                        'A string (indicating which browser version added this feature), the value true (indicating support added in an unknown version), the value false (indicating the feature is not supported), or the value null (indicating support is unknown).',
                      ),
                    version_removed: z
                      .union([
                        z
                          .string()
                          .regex(new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$')),
                        z.literal(true),
                      ])
                      .describe(
                        'A string, indicating which browser version removed this feature, or the value true, indicating that the feature was removed in an unknown version.',
                      )
                      .optional(),
                    version_last: z
                      .union([
                        z
                          .string()
                          .regex(new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$')),
                        z.literal(true),
                      ])
                      .describe(
                        'A string, indicating the last browser version that supported this feature, or the value true, indicating that the feature was removed in an unknown version. This is automatically generated.',
                      )
                      .optional(),
                    prefix: z
                      .string()
                      .describe(
                        "A prefix to add to the sub-feature name (defaults to empty string). If applicable, leading and trailing '-' must be included.",
                      )
                      .optional(),
                    alternative_name: z
                      .string()
                      .describe(
                        'An alternative name for the feature, for cases where a feature is implemented under an entirely different name and not just prefixed.',
                      )
                      .optional(),
                    flags: z
                      .array(
                        z
                          .object({
                            type: z
                              .enum(['preference', 'runtime_flag'])
                              .describe(
                                'An enum that indicates the flag type.',
                              ),
                            name: z
                              .string()
                              .describe(
                                'A string giving the name of the flag or preference that must be configured.',
                              ),
                            value_to_set: z
                              .string()
                              .describe(
                                'A string giving the value which the specified flag must be set to for this feature to work.',
                              )
                              .optional(),
                          })
                          .strict(),
                      )
                      .min(1)
                      .describe(
                        'An optional array of objects describing flags that must be configured for this browser to support this feature.',
                      )
                      .optional(),
                    impl_url: z
                      .union([
                        z
                          .string()
                          .url()
                          .regex(
                            new RegExp(
                              '^https://(trac.webkit.org/changeset/|hg.mozilla.org/mozilla-central/rev/|crrev.com/|bugzil.la/|crbug.com/|webkit.org/b/)',
                            ),
                          ),
                        z
                          .array(
                            z
                              .string()
                              .url()
                              .regex(
                                new RegExp(
                                  '^https://(trac.webkit.org/changeset/|hg.mozilla.org/mozilla-central/rev/|crrev.com/|bugzil.la/|crbug.com/|webkit.org/b/)',
                                ),
                              ),
                          )
                          .min(2),
                      ])
                      .describe(
                        'An optional changeset/commit URL for the revision which implemented the feature in the source code, or the URL to the bug tracking the implementation, for the associated browser.',
                      )
                      .optional(),
                    partial_implementation: z
                      .literal(true)
                      .describe(
                        'A boolean value indicating whether or not the implementation of the sub-feature deviates from the specification in a way that may cause compatibility problems. It defaults to false (no interoperability problems expected). If set to true, it is recommended that you add a note explaining how it diverges from the standard (such as that it implements an old version of the standard, for example).',
                      )
                      .optional(),
                    notes: z
                      .union([z.string(), z.array(z.string()).min(2)])
                      .describe(
                        'A string or array of strings containing additional information.',
                      )
                      .optional(),
                  })
                  .strict(),
                z
                  .array(
                    z
                      .object({
                        version_added: z
                          .union([
                            z
                              .string()
                              .regex(
                                new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$'),
                              ),
                            z.boolean().nullable(),
                          ])
                          .describe(
                            'A string (indicating which browser version added this feature), the value true (indicating support added in an unknown version), the value false (indicating the feature is not supported), or the value null (indicating support is unknown).',
                          ),
                        version_removed: z
                          .union([
                            z
                              .string()
                              .regex(
                                new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$'),
                              ),
                            z.literal(true),
                          ])
                          .describe(
                            'A string, indicating which browser version removed this feature, or the value true, indicating that the feature was removed in an unknown version.',
                          )
                          .optional(),
                        version_last: z
                          .union([
                            z
                              .string()
                              .regex(
                                new RegExp('^(≤?(\\d+)(\\.\\d+)*|preview)$'),
                              ),
                            z.literal(true),
                          ])
                          .describe(
                            'A string, indicating the last browser version that supported this feature, or the value true, indicating that the feature was removed in an unknown version. This is automatically generated.',
                          )
                          .optional(),
                        prefix: z
                          .string()
                          .describe(
                            "A prefix to add to the sub-feature name (defaults to empty string). If applicable, leading and trailing '-' must be included.",
                          )
                          .optional(),
                        alternative_name: z
                          .string()
                          .describe(
                            'An alternative name for the feature, for cases where a feature is implemented under an entirely different name and not just prefixed.',
                          )
                          .optional(),
                        flags: z
                          .array(
                            z
                              .object({
                                type: z
                                  .enum(['preference', 'runtime_flag'])
                                  .describe(
                                    'An enum that indicates the flag type.',
                                  ),
                                name: z
                                  .string()
                                  .describe(
                                    'A string giving the name of the flag or preference that must be configured.',
                                  ),
                                value_to_set: z
                                  .string()
                                  .describe(
                                    'A string giving the value which the specified flag must be set to for this feature to work.',
                                  )
                                  .optional(),
                              })
                              .strict(),
                          )
                          .min(1)
                          .describe(
                            'An optional array of objects describing flags that must be configured for this browser to support this feature.',
                          )
                          .optional(),
                        impl_url: z
                          .union([
                            z
                              .string()
                              .url()
                              .regex(
                                new RegExp(
                                  '^https://(trac.webkit.org/changeset/|hg.mozilla.org/mozilla-central/rev/|crrev.com/|bugzil.la/|crbug.com/|webkit.org/b/)',
                                ),
                              ),
                            z
                              .array(
                                z
                                  .string()
                                  .url()
                                  .regex(
                                    new RegExp(
                                      '^https://(trac.webkit.org/changeset/|hg.mozilla.org/mozilla-central/rev/|crrev.com/|bugzil.la/|crbug.com/|webkit.org/b/)',
                                    ),
                                  ),
                              )
                              .min(2),
                          ])
                          .describe(
                            'An optional changeset/commit URL for the revision which implemented the feature in the source code, or the URL to the bug tracking the implementation, for the associated browser.',
                          )
                          .optional(),
                        partial_implementation: z
                          .literal(true)
                          .describe(
                            'A boolean value indicating whether or not the implementation of the sub-feature deviates from the specification in a way that may cause compatibility problems. It defaults to false (no interoperability problems expected). If set to true, it is recommended that you add a note explaining how it diverges from the standard (such as that it implements an old version of the standard, for example).',
                          )
                          .optional(),
                        notes: z
                          .union([z.string(), z.array(z.string()).min(2)])
                          .describe(
                            'A string or array of strings containing additional information.',
                          )
                          .optional(),
                      })
                      .strict(),
                  )
                  .min(2),
                z.literal('mirror'),
              ]),
            ),
            status: z
              .object({
                experimental: z
                  .boolean()
                  .describe(
                    'A boolean value that indicates the general stability of this feature. This value will be true if the feature was implemented in one browser engine recently. This value will be false if the feature was implemented in multiple browser engines, or if the feature had been implemented over two years ago in any one browser engine.',
                  ),
                standard_track: z
                  .boolean()
                  .describe(
                    'A boolean value indicating whether the feature is part of an active specification or specification process.',
                  ),
                deprecated: z
                  .boolean()
                  .describe(
                    'A boolean value that indicates whether the feature is no longer recommended. It might be removed in the future or might only be kept for compatibility purposes. Avoid using this functionality.',
                  ),
              })
              .strict()
              .optional(),
          })
          .strict()
          .safeParse(value[key]);
        if (!result.success) {
          ctx.addIssue({
            path: [...ctx.path, key],
            code: 'custom',
            message: `Invalid input: Key matching regex /${key}/ must match schema`,
            params: {
              issues: result.error.issues,
            },
          });
        }
      }
      if (!evaluated) {
        const result = z.never().safeParse(value[key]);
        if (!result.success) {
          ctx.addIssue({
            path: [...ctx.path, key],
            code: 'custom',
            message: `Invalid input: must match catchall schema`,
            params: {
              issues: result.error.issues,
            },
          });
        }
      }
    }
  });

const bundlerCompatDataCollection = defineCollection({
  type: 'data',
  schema: bundlerCompatSchema,
});

export const collections = {
  'bundler-compat-data': bundlerCompatDataCollection,
};
