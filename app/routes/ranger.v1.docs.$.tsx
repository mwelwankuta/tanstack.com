import { useLoaderData } from '@remix-run/react'
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { extractFrontMatter, fetchRepoFile } from '~/utils/documents.server'
import { repo, v1branch } from '~/projects/ranger'
import { DefaultErrorBoundary } from '~/components/DefaultErrorBoundary'
import { seo } from '~/utils/seo'
import removeMarkdown from 'remove-markdown'
import { Doc } from '~/components/Doc'

export const loader = async (context: LoaderFunctionArgs) => {
  const { '*': docsPath } = context.params

  if (!docsPath) {
    throw new Error('Invalid docs path')
  }

  const filePath = `docs/${docsPath}.md`

  const file = await fetchRepoFile('tanstack/ranger', v1branch, filePath)

  if (!file) {
    throw new Response('Not Found', {
      status: 404,
    })
  }

  const frontMatter = extractFrontMatter(file)
  const description = removeMarkdown(frontMatter.excerpt ?? '')

  return json(
    {
      title: frontMatter.data.title,
      description,
      filePath,
      content: frontMatter.content,
    },
    {
      headers: {
        'Cache-Control': 's-maxage=1, stale-while-revalidate=300',
      },
    }
  )
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return seo({
    title: `${data?.title ?? 'Docs'} | TanStack Ranger Docs`,
    description: data?.description,
  })
}

export const ErrorBoundary = DefaultErrorBoundary

export default function RouteReactRangerDocs() {
  const { title, content, filePath } = useLoaderData<typeof loader>()

  return (
    <Doc
      title={title}
      content={content}
      repo={repo}
      branch={v1branch}
      filePath={filePath}
    />
  )
}
