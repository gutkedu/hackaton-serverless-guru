export interface QuotableApiListQuotesQuery {
  maxLength?: number
  minLength?: number
  tags?: string
  author?: string
  sortBy?: 'dateAdded' | 'dateModified' | 'author' | 'content'
  order?: 'asc' | 'desc'
  limit?: number
  page?: number
}

interface QuotableApiQuote {
  _id: string
  author: string
  content: string
  tags: string[]
  authorSlug: string
  length: number
  dateAdded: string
  dateModified: string
}

export interface QuotableApiListQuotesResponse {
  count: number
  totalCount: number
  page: number
  totalPages: number
  lastItemIndex: number
  results: QuotableApiQuote[]
}

export interface QuotableRandomQuoteRequest {
  maxLength?: number
  minLength?: number
  tags?: string
  author?: string
}
export interface QuotableRandomQuoteResponse {
  _id: string
  content: string
  author: string
  authorSlug: string
  length: number
  tags: string[]
}
