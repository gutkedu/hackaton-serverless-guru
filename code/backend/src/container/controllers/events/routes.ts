import { FastifyInstance } from 'fastify'
import { gameStartedController } from './game-started.js'

export async function eventsRoutes(fastify: FastifyInstance) {
  //TODO: add hook for authentication with awsSignatureV4
  fastify.post('/events/game-started', gameStartedController)
}
