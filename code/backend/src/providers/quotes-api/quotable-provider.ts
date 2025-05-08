import { IntegrationError } from '@/shared/errors/integration-error.js'
import {
  QuotableApiListQuotesQuery,
  QuotableApiListQuotesResponse,
  QuotableRandomQuoteRequest,
  QuotableRandomQuoteResponse
} from './dtos.js'
import { QuotesProvider } from './quotes-provider.js'

export class QuotableApiProvider implements QuotesProvider {
  private readonly baseUrl: string

  constructor() {
    this.baseUrl = 'https://api.quotable.io'
  }

  async listQuotes(data: QuotableApiListQuotesQuery): Promise<QuotableApiListQuotesResponse> {
    try {
      const url = new URL('/quotes', this.baseUrl)

      Object.entries(data || {}).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, value.toString())
        }
      })

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new IntegrationError(`Failed to fetch quotes: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()

      return responseData as QuotableApiListQuotesResponse
    } catch (error) {
      if (error instanceof IntegrationError) {
        throw error
      } else {
        throw new IntegrationError(`An unexpected error occurred calling the quotableApi: ${error}`)
      }
    }
  }
  async getRandomQuote(data: QuotableRandomQuoteRequest): Promise<QuotableRandomQuoteResponse> {
    try {
      const url = new URL('/random', this.baseUrl)

      Object.entries(data || {}).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, value.toString())
        }
      })

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new IntegrationError(`Failed to fetch quotes: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()

      return responseData as QuotableRandomQuoteResponse
    } catch (error) {
      if (error instanceof IntegrationError) {
        throw error
      } else {
        throw new IntegrationError(`An unexpected error occurred calling the quotableApi: ${error}`)
      }
    }
  }
}
