import { GetStaticPaths, GetStaticProps } from 'next';

import { Fragment } from 'react';

import { RichText } from 'prismic-dom';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const { isFallback } = useRouter();

  if (isFallback) {
    return <h1>Carregando...</h1>;
  }

  return (
    <div className={styles.container}>
      <img src={post.data.banner.url} alt="banner" width="1140" height="400" />
      <main className={styles.content}>
        <header>
          <h1>{post.data.title}</h1>
          <div>
            <span>
              <FiCalendar size={20} color="#BBBBBB" />
              {format(new Date(post.first_publication_date), 'PP', {
                locale: ptBR,
              })}
            </span>
            <span>
              <FiUser size={20} color="#BBBBBB" />
              {post.data.author}
            </span>
            <span>
              <FiClock size={20} color="#BBBBBB" />4 min
            </span>
          </div>
        </header>
        <article>
          {post.data.content.map(content => {
            return (
              <section key={content.heading}>
                <h2>{content.heading}</h2>
                <div
                  className={styles.paragraph}
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </section>
            );
          })}
        </article>
      </main>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts', {
    pageSize: 2,
    page: 1,
  });
  const paths = posts.results.map(post => {
    return { params: { slug: post.uid } };
  });
  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const uid = String(params.slug);

  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('posts', uid);
  const { content } = response.data;

  return {
    props: {
      post: {
        uid: response.uid,
        first_publication_date: response.first_publication_date,
        data: {
          subtitle: response.data.subtitle,
          title: response.data.title,
          banner: {
            url: response.data.banner.url,
          },
          author: response.data.author,
          content,
        },
      },
    },
    revalidate: 60 * 60 * 1, // 1hour
  };
};
