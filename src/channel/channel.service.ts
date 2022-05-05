import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ApiChannelRepository } from 'src/shared/api-channel.repository';
import { WebhookSenderService } from 'src/shared/webhook-sender.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { Channel } from './entities/channel.entity';

@Injectable()
export class ChannelService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly apiChannelRepository: ApiChannelRepository,
    private readonly webhookSenderService: WebhookSenderService,
  ) {}

  async create(
    projectId: number,
    createChannelDto: CreateChannelDto,
  ): Promise<Channel> {
    return this.apiChannelRepository
      .get(createChannelDto.type)
      .create(projectId, createChannelDto);
  }

  async findAll(projectId: number): Promise<Channel[]> {
    return this.prismaService.channel.findMany({
      where: {
        projectId,
      },
    });
  }

  async findOne(projectId: number, id: number): Promise<Channel> {
    return this.prismaService.channel.findUnique({
      where: {
        projectId_id: {
          projectId,
          id,
        },
      },
    });
  }

  async update(
    projectId: number,
    id: number,
    updateChannelDto: UpdateChannelDto,
  ): Promise<Channel> {
    return this.prismaService.channel.update({
      where: {
        projectId_id: {
          projectId,
          id,
        },
      },
      data: updateChannelDto,
    });
  }

  async delete(projectId: number, id: number): Promise<Channel> {
    return this.prismaService.channel.delete({
      where: {
        projectId_id: {
          projectId,
          id,
        },
      },
    });
  }

  async handle(channelId: number, event: any): Promise<'ok'> {
    const channel = await this.prismaService.channel.findUnique({
      where: {
        id: channelId,
      },
    });

    return this.apiChannelRepository
      .get(channel.type)
      .handle(channel, event, this.webhookSenderService);
  }
}
