import { Item } from './item.js'

export interface ScoreboardPlayer {
  username: string
  bestWpm: number
  gamesPlayedInvolvingScoreboard: number
  lastGameTimestamp: string
}

export interface GameStatisticsProps {
  id?: string
  totalGamesStarted: number
  totalGamesFinished: number
  activePlayersCount?: number
  peakConcurrentPlayers?: number
  topPlayersScoreboard: ScoreboardPlayer[]
  lastUpdated?: string
  createdAt?: string
}

interface GameStatisticsDynamoKeys {
  pk: `STATS`
  sk: `GLOBAL`
}

export interface GameStatisticsDynamo extends GameStatisticsProps, GameStatisticsDynamoKeys {}

export class GameStatisticsEntity extends Item<GameStatisticsProps> {
  private static readonly GLOBAL_STATS_ID = 'GLOBAL_STATS_V1'

  get pk(): GameStatisticsDynamoKeys['pk'] {
    return `STATS`
  }

  get sk(): GameStatisticsDynamoKeys['sk'] {
    return `GLOBAL`
  }

  get id(): string {
    return this.props.id as string
  }

  get totalGamesStarted(): number {
    return this.props.totalGamesStarted
  }

  get totalGamesFinished(): number {
    return this.props.totalGamesFinished
  }

  get topPlayersScoreboard(): ScoreboardPlayer[] {
    return this.props.topPlayersScoreboard
  }

  get createdAt(): string | undefined {
    return this.props.createdAt
  }

  get lastUpdated(): string | undefined {
    return this.props.lastUpdated
  }

  constructor(props: Partial<GameStatisticsProps>) {
    super({
      id: props.id || GameStatisticsEntity.GLOBAL_STATS_ID,
      totalGamesStarted: props.totalGamesStarted ?? 0,
      totalGamesFinished: props.totalGamesFinished ?? 0,
      topPlayersScoreboard: props.topPlayersScoreboard ?? [],
      createdAt: props.createdAt || new Date().toISOString(),
      lastUpdated: props.lastUpdated || new Date().toISOString(),
      ...props // Spread remaining props
    })
  }

  public static getGlobalStatsId(): string {
    return GameStatisticsEntity.GLOBAL_STATS_ID
  }

  public incrementGamesStarted(): void {
    this.props.totalGamesStarted = (this.props.totalGamesStarted ?? 0) + 1
    this.touch()
  }

  public incrementGamesFinished(): void {
    this.props.totalGamesFinished = (this.props.totalGamesFinished ?? 0) + 1
    this.touch()
  }

  public setTotalGamesStarted(count: number): void {
    if (this.props.totalGamesStarted !== count) {
      this.props.totalGamesStarted = count
      this.touch()
    }
  }

  public setTotalGamesFinished(count: number): void {
    if (this.props.totalGamesFinished !== count) {
      this.props.totalGamesFinished = count
      this.touch()
    }
  }

  public updatePlayerOnScoreboard(
    playerUpdate: { username: string; wpm: number; gameTimestamp: string },
    maxScoreboardSize: number = 10
  ): void {
    const existingPlayerIndex = this.props.topPlayersScoreboard.findIndex((p) => p.username === playerUpdate.username)
    let playerEntry: ScoreboardPlayer

    if (existingPlayerIndex > -1) {
      playerEntry = this.props.topPlayersScoreboard[existingPlayerIndex]
      playerEntry.bestWpm = Math.max(playerEntry.bestWpm, playerUpdate.wpm)
      playerEntry.gamesPlayedInvolvingScoreboard += 1
      playerEntry.lastGameTimestamp = playerUpdate.gameTimestamp
    } else {
      playerEntry = {
        username: playerUpdate.username,
        bestWpm: playerUpdate.wpm,
        gamesPlayedInvolvingScoreboard: 1,
        lastGameTimestamp: playerUpdate.gameTimestamp
      }
    }

    const updatedScoreboard = this.props.topPlayersScoreboard.filter((p) => p.username !== playerUpdate.username)
    updatedScoreboard.push(playerEntry)

    // Sort the scoreboard by bestWpm, then by gamesPlayedInvolvingScoreboard, and finally by lastGameTimestamp
    updatedScoreboard.sort((a, b) => {
      if (b.bestWpm !== a.bestWpm) {
        return b.bestWpm - a.bestWpm
      }
      if (a.gamesPlayedInvolvingScoreboard !== b.gamesPlayedInvolvingScoreboard) {
        return b.gamesPlayedInvolvingScoreboard - a.gamesPlayedInvolvingScoreboard
      }
      return new Date(a.lastGameTimestamp).getTime() - new Date(b.lastGameTimestamp).getTime()
    })

    this.props.topPlayersScoreboard = updatedScoreboard.slice(0, maxScoreboardSize)
    this.touch()
  }

  private touch(): void {
    this.props.lastUpdated = new Date().toISOString()
  }

  getDynamoKeys(): GameStatisticsDynamoKeys {
    return {
      pk: this.pk,
      sk: this.sk
    }
  }

  toDynamoItem(): GameStatisticsDynamo {
    return {
      ...this.getDynamoKeys(),
      ...this.props
    }
  }

  toProps(): GameStatisticsProps {
    return { ...this.props }
  }

  toJSON() {
    return {
      id: this.id,
      totalGamesStarted: this.totalGamesStarted,
      totalGamesFinished: this.totalGamesFinished,
      topPlayersScoreboard: this.topPlayersScoreboard,
      lastUpdated: this.props.lastUpdated,
      createdAt: this.props.createdAt
    }
  }

  static fromDynamoItem(item: GameStatisticsDynamo): GameStatisticsEntity {
    return new GameStatisticsEntity(item)
  }

  static create(props?: Partial<GameStatisticsProps>): GameStatisticsEntity {
    const defaultProps: GameStatisticsProps = {
      id: GameStatisticsEntity.GLOBAL_STATS_ID,
      totalGamesStarted: 0,
      totalGamesFinished: 0,
      topPlayersScoreboard: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }
    return new GameStatisticsEntity({ ...defaultProps, ...props })
  }
}
