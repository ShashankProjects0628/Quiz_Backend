export type IRedisPagination = {
  limit?: string | number;
  skip?: string | number;
};
export type IFetchRecordsFromSortedSets = {
  setName: string;
  filter?: { min: string | number; max: string | number };
  rev?: true;
  sort?: 'SCORE' | 'LEX';
} & IRedisPagination;

export type ZRANGEConfig = {
  BY: 'SCORE' | 'LEX';
  REV?: true;
  LIMIT?: {
    offset: number;
    count: number;
  };
};

export type ISortedKeyValue = {
  score: number;
  value: string;
};
