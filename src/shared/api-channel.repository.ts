import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChannelType } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { ApiChannel } from './api-channel.interface';
import { TelegramApiChannel } from './telegram.api-channel';
import { WebchatApiChannel } from './webchat.api-channel';
import { WhatsappApiChannel } from './whatsapp.api-channel';

@Injectable()
export class ApiChannelRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private [ChannelType.Telegram] = TelegramApiChannel;
  private [ChannelType.Webchat] = WebchatApiChannel;
  private [ChannelType.Whatsapp] = WhatsappApiChannel;

  get(type: ChannelType): ApiChannel {
    return new this[type](this.prismaService, this.configService);
  }
}
