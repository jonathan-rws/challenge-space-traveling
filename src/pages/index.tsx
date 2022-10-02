import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';

import { FiCalendar, FiUser, FiWatch } from 'react-icons/fi';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';

import styles from './home.module.scss';
import { getStaticPaths } from './post/[slug]';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string>(postsPagination.next_page);

  async function handleLoadNextPage(): Promise<void> {
    try {
      const response = await fetch(nextPage);
      const { results, next_page } = await response.json();
      const newPosts = results.map(post => {
        return {
          uid: post.uid,
          first_publication_date: post.first_publication_date,
          data: {
            title: post.data.title,
            subtitle: post.data.subtitle,
            author: post.data.author,
          },
        };
      });

      setPosts(state => [...state, ...newPosts]);
      setNextPage(next_page);
    } catch (error) {
      console.log({ message: error });
    }
  }

  return (
    <main className={styles.main}>
      {posts.map(post => {
        return (
          <article className={styles.post} key={post.uid}>
            <Link href={`/post/${post.uid}`}>
              <a className={styles.post}>
                <h1>{post.data.title}</h1>
                <span>{post.data.subtitle}</span>
                <footer>
                  <div>
                    <FiCalendar size={20} color="#BBBBBB" />
                    <span>
                      {format(new Date(post.first_publication_date), 'PP', {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <div>
                    <FiUser size={20} color="#BBBBBB" />
                    <span>{post.data.author}</span>
                  </div>
                </footer>
              </a>
            </Link>
          </article>
        );
      })}

      {!!nextPage && (
        <button onClick={handleLoadNextPage} type="button" disabled={!nextPage}>
          Carregar mais posts
        </button>
      )}
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const { results, next_page } = await prismic.getByType('posts', {
    pageSize: 2,
    orderings: {
      direction: 'desc',
      field: 'document.first_publication_date',
    },
  });

  const posts = results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page,
        results: posts,
      },
    },
    revalidate: 60 * 60 * 1, // 1hour
  };
};
