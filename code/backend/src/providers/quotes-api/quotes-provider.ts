import {
  QuotableApiListQuotesQuery,
  QuotableApiListQuotesResponse,
  QuotableRandomQuoteRequest,
  QuotableRandomQuoteResponse
} from './dtos.js'

export interface QuotesProvider {
  listQuotes(data: QuotableApiListQuotesQuery): Promise<QuotableApiListQuotesResponse>
  getRandomQuote(data: QuotableRandomQuoteRequest): Promise<QuotableRandomQuoteResponse>
}
