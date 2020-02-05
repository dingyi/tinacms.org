import React, { useState } from 'react'
import matter from 'gray-matter'
import styled from 'styled-components'

import {
  DocsLayout,
  MarkdownContent,
  RichTextWrapper,
  Wrapper,
  Pagination,
} from '../../components/layout'
import { DocsNav, NavToggle, HeaderNav, Overlay } from '../../components/ui'
import { TinaIcon } from '../../components/logo/TinaIcon'
import { readFile } from '../../utils/readFile'

export default function DocTemplate(props) {
  const [open, setOpen] = useState(false)
  const frontmatter = props.doc.data
  const markdownBody = props.doc.content
  return (
    <DocsLayout>
      <DocsNav open={open} navItems={props.docsNav} />
      <DocsContent>
        <DocsHeader open={open}>
          <TinaIcon />
          <NavToggle open={open} onClick={() => setOpen(!open)} />
          <HeaderNav color={'seafoam'} open={open} />
          <iframe
            src="https://ghbtns.com/github-btn.html?user=tinacms&repo=tinacms&type=star&count=true&size=large"
            frameBorder="0"
            scrolling="0"
            width="145px"
            height="30px"
          ></iframe>
        </DocsHeader>
        <RichTextWrapper>
          <Wrapper narrow>
            <h1>{frontmatter.title}</h1>
            <hr />
            <MarkdownContent content={markdownBody} />
            <Pagination prevPage={props.prevPage} nextPage={props.nextPage} />
          </Wrapper>
        </RichTextWrapper>
      </DocsContent>
      <Overlay open={open} onClick={() => setOpen(false)} />
    </DocsLayout>
  )
}

export async function unstable_getStaticProps(ctx) {
  let { slug: slugs } = ctx.params

  const slug = slugs.join('/')
  const content = await readFile(`content/docs/${slug}.md`)
  const doc = matter(content)

  const docsNavData = await import('../../content/toc-doc.json')
  const nextDocPage =
    doc.data.next && matter(await readFile(`content${doc.data.next}.md`))
  const prevDocPage =
    doc.data.prev && matter(await readFile(`content${doc.data.prev}.md`))

  return {
    props: {
      doc: {
        data: { ...doc.data, slug },
        content: doc.content,
      },
      docsNav: docsNavData.default,
      nextPage: {
        slug: doc.data.next,
        title: nextDocPage && nextDocPage.data.title,
      },
      prevPage: {
        slug: doc.data.prev,
        title: prevDocPage && prevDocPage.data.title,
      },
    },
  }
}

export async function unstable_getStaticPaths() {
  const fg = require('fast-glob')
  const contentDir = './content/docs/'
  const files = await fg(`${contentDir}**/*.md`)
  return files.map(file => {
    const path = file.substring(contentDir.length, file.length - 3)
    return { params: { slug: path.split('/') } }
  })
}

interface DocsHeader {
  open: boolean
}

const DocsHeader = styled.div<DocsHeader>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 250;
  height: 5rem;
  display: flex;
  justify-content: flex-end;
  align-items: center;

  ${TinaIcon} {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate3d(-50%, -50%, 0);
    z-index: 500;

    @media (min-width: 999px) {
      left: 2rem;
      transform: translate3d(0, -50%, 0);
      position: fixed;
      top: 2.5rem;
      left: 2rem;
    }
  }

  ${NavToggle} {
    position: fixed;
    top: 1.25rem;
    left: 1rem;
    z-index: 500;

    @media (min-width: 999px) {
      display: none;
    }
  }

  ${HeaderNav} {
    @media (max-width: 999px) {
      display: none;
    }
  }

  iframe {
    margin: 0 2rem 0 1rem;
    @media (max-width: 450px) {
      display: none;
    }
  }
`

const DocsContent = styled.div`
  grid-area: content;
  overflow-y: auto;

  ${Wrapper} {
    padding-top: 6rem;
    padding-bottom: 3rem;
  }

  h1,
  .h1 {
    font-size: 2rem;

    @media (min-width: 800px) {
      font-size: 3rem;
    }

    @media (min-width: 1200px) {
      font-size: 2.5rem;
    }
  }

  h2,
  .h2 {
    font-size: 1.75rem;
  }
`