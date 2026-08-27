import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NewsInput } from '@/lib/security/validators';

// Fetch news from the API
const fetchNews = async (): Promise<NewsInput[]> => {
  const res = await fetch('/api/news');
  if (!res.ok) {
    throw new Error('Failed to fetch news');
  }
  const data = await res.json();
  return data.news || [];
};

// Fetch a single news item by ID
const fetchNewsById = async (id: string): Promise<NewsInput> => {
  const res = await fetch(`/api/news?id=${id}`);
  if (!res.ok) {
    throw new Error('Failed to fetch news');
  }
  const data = await res.json();
  return data.news;
};

// Create a new news item
const createNews = async (news: NewsInput): Promise<NewsInput> => {
  const res = await fetch('/api/news', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(news),
  });
  if (!res.ok) {
    throw new Error('Failed to create news');
  }
  const data = await res.json();
  return data.news;
};

// Update a news item
const updateNews = async ({ id, news }: { id: string; news: NewsInput }): Promise<NewsInput> => {
  const res = await fetch(`/api/news?id=${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(news),
  });
  if (!res.ok) {
    throw new Error('Failed to update news');
  }
  const data = await res.json();
  return data.news;
};

// Delete a news item
const deleteNews = async (id: string): Promise<void> => {
  const res = await fetch(`/api/news?id=${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Failed to delete news');
  }
};

export const useNews = () => {
  const queryClient = useQueryClient();

  const { data: news, isLoading, error } = useQuery<NewsInput[], Error>(['news'], fetchNews, {
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 15, // 15 minutes (matches our cron job)
  });

  const createNewsMutation = useMutation(createNews, {
    onSuccess: () => {
      queryClient.invalidateQueries(['news']);
    },
  });

  const updateNewsMutation = useMutation(updateNews, {
    onSuccess: () => {
      queryClient.invalidateQueries(['news']);
    },
  });

  const deleteNewsMutation = useMutation(deleteNews, {
    onSuccess: () => {
      queryClient.invalidateQueries(['news']);
    },
  });

  return {
    news,
    isLoading,
    error,
    createNews: createNewsMutation.mutateAsync,
    updateNews: updateNewsMutation.mutateAsync,
    deleteNews: deleteNewsMutation.mutateAsync,
  };
};

export const useNewsById = (id: string) => {
  return useQuery<NewsInput, Error>(['news', id], () => fetchNewsById(id), {
    enabled: !!id,
  });
};
