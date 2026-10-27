export type SearchResult = {
  id: string;
  title: string;
  uploader: string;
  duration: number | null;
  views: number;
  thumbnail: string | null;
  url: string;
};

export type GlobalError = {
  error: string;
  debugMessage?: string;
};
