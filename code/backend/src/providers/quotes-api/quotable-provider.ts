import { IntegrationError } from '@/shared/errors/integration-error.js'
import {
  QuotableApiListQuotesQuery,
  QuotableApiListQuotesResponse,
  QuotableRandomQuoteRequest,
  QuotableRandomQuoteResponse
} from './dtos.js'
import { QuotesProvider } from './quotes-provider.js'
import { getLogger } from '@/shared/logger/get-logger.js'

const logger = getLogger()

export class QuotableApiProvider implements QuotesProvider {
  private readonly baseUrl: string

  constructor() {
    this.baseUrl = 'http://api.quotable.io'
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
      const url = new URL(`${this.baseUrl}/random`)

      Object.entries(data || {}).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, value.toString())
        }
      })

      logger.info('Fetching random quote from Quotable API', { url: url.toString() })

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AWS-Lambda/TypeScript'
        },
        cache: 'no-store',
        redirect: 'follow',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })

      if (!response.ok) {
        logger.error('Error fetching random quote from Quotable API', {
          status: response.status,
          statusText: response.statusText
        })
        throw new IntegrationError(`Failed to fetch quotes: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()
      logger.info('Successfully fetched random quote')

      return responseData as QuotableRandomQuoteResponse
    } catch (error) {
      logger.error('Error fetching random quote from Quotable API', { error })

      if (error instanceof IntegrationError) {
        throw error
      } else {
        throw new IntegrationError(`An unexpected error occurred calling the quotableApi: ${error}`)
      }
    }
  }
}
