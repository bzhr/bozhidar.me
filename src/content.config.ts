import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const githubRepository = z.string().url().refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'github.com' &&
      !url.username && !url.password && /^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(url.pathname) &&
      !url.search && !url.hash;
  } catch {
    return false;
  }
}, 'Repository URL must be an HTTPS GitHub owner/repository URL');

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.date(),
      updatedDate: z.date().optional(),
      tags: z.array(z.string()).default([]),
      image: image().optional(),
      imageAlt: z.string().optional(),
      repository: z.object({
        url: githubRepository,
        description: z.string().optional(),
        problem: z.string().optional(),
        contribution: z.string().optional(),
        approach: z.string().optional(),
        outcome: z.string().optional(),
      }).optional(),
    }),
});

export const collections = { blog };
