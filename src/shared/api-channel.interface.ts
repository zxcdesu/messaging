import { ConfigService } from '@nestjs/config';
import Prisma from '@prisma/client';
import { CreateChannelDto } from 'src/channel/dto/create-channel.dto';
import { Channel } from 'src/channel/entities/channel.entity';
import { CreateMessageDto } from 'src/chat/dto/create-message.dto';
import { PrismaService } from 'src/prisma.service';
import { WebhookSenderService } from './webhook-sender.service';

export abstract class ApiChannel<T = unknown> {
  constructor(
    protected readonly prismaService: PrismaService,
    protected readonly configService: ConfigService,
  ) {}

  abstract create(
    projectId: number,
    createChannelDto: CreateChannelDto,
  ): Promise<Channel>;

  abstract send(
    channel: Prisma.Channel,
    chat: Prisma.Chat,
    message: CreateMessageDto,
  ): Promise<any[]>;

  abstract handle(
    channel: Prisma.Channel,
    event: T,
    webhookSenderService: WebhookSenderService,
  ): Promise<'ok'>;
}
