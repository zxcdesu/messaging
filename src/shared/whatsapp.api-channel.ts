import { BadRequestException, NotImplementedException } from '@nestjs/common';
import * as Prisma from '@prisma/client';
import { MessageStatus } from '@prisma/client';
import axios from 'axios';
import { plainToClass } from 'class-transformer';
import { CreateChannelDto } from 'src/channel/dto/create-channel.dto';
import { Channel } from 'src/channel/entities/channel.entity';
import { CreateMessageDto } from 'src/chat/dto/create-message.dto';
import { Chat } from 'src/chat/entities/chat.entity';
import { MessageWithChatId } from 'src/chat/entities/message-with-chat-id.entity';
import { ApiChannel } from './api-channel.interface';
import { WebhookSenderService } from './webhook-sender.service';

export class WhatsappApiChannel extends ApiChannel {
  async create(
    projectId: number,
    createChannelDto: CreateChannelDto,
  ): Promise<Channel> {
    throw new NotImplementedException();

    // try {
    //   const api = new GupshupPartnerApi(
    //     this.configService.get<string>('GS_USER'),
    //     this.configService.get<string>('GS_PASS'),
    //   );

    //   const app = await api.linkApp(
    //     createChannelDto.accountId,
    //     createChannelDto.token,
    //   );

    //   const token = await api.createToken(app.id);

    //   const channel = await this.prismaService.channel.create({
    //     data: {
    //       projectId,
    //       name: createChannelDto.name,
    //       type: ChannelType.Whatsapp,
    //       accountId: `${app.id}:${app.name}:${app.phone}`,
    //       token,
    //       status: Prisma.ChannelStatus.Connected,
    //     },
    //   });

    //   const url = this.configService.get<string>('MESSAGING_URL');
    //   await api.setWebhook(
    //     app.id,
    //     token,
    //     url.concat(`/channels/${channel.id}/webhook`),
    //   );

    //   return channel;
    // } catch {
    //   throw new BadRequestException();
    // }
  }

  async send(
    channel: Prisma.Channel,
    chat: Prisma.Chat,
    message: CreateMessageDto,
  ): Promise<MessageWithChatId[]> {
    throw new NotImplementedException();

    // const messages: Prisma.Prisma.MessageUncheckedCreateInput[] = [];

    // if (message.buttons) {
    //   messages.push(await this.sendHsm(channel, chat, message));
    // } else {
    //   const [, appName, phone] = channel.accountId.split(':');
    //   const api = new GupshupClientApi(phone, appName, channel.token);

    //   if (message.text) {
    //     messages.push({
    //       chatId: chat.id,
    //       externalId: await api.sendMessage(chat.accountId, {
    //         type: 'text',
    //         text: message.text,
    //       }),
    //       fromMe: true,
    //       status: Prisma.MessageStatus.Accepted,
    //       content: {
    //         create: {
    //           text: message.text,
    //         },
    //       },
    //     });
    //   }

    //   await Promise.all(
    //     message.attachments.map(async (attachment) => {
    //       const msg: any = {};
    //       switch (attachment.type) {
    //         case Prisma.AttachmentType.Audio:
    //           Object.assign(msg, {
    //             type: 'audio',
    //             url: attachment.url,
    //           });
    //           break;

    //         case Prisma.AttachmentType.Document:
    //           Object.assign(msg, {
    //             type: 'file',
    //             url: attachment.url,
    //           });
    //           break;

    //         case Prisma.AttachmentType.Image:
    //           Object.assign(msg, {
    //             type: 'image',
    //             previewUrl: attachment.url,
    //             originalUrl: attachment.url,
    //           });
    //           break;

    //         case Prisma.AttachmentType.Video:
    //           Object.assign(msg, {
    //             type: 'video',
    //             url: attachment.url,
    //           });
    //           break;
    //       }

    //       messages.push({
    //         chatId: chat.id,
    //         externalId: await api.sendMessage(chat.accountId, msg),
    //         fromMe: true,
    //         status: Prisma.MessageStatus.Accepted,
    //         content: {
    //           create: {
    //             attachments: {
    //               create: attachment,
    //             },
    //           },
    //         },
    //       });
    //     }),
    //   );
    // }

    // return Promise.all(
    //   messages.map(async (message) =>
    //     plainToClass(
    //       MessageWithChatId,
    //       this.prismaService.message.create({
    //         data: message,
    //         include: {
    //           chat: {
    //             select: {
    //               id: true,
    //             },
    //           },
    //           content: {
    //             orderBy: {
    //               id: 'desc',
    //             },
    //             take: 1,
    //             include: {
    //               attachments: true,
    //             },
    //           },
    //         },
    //       }),
    //     ),
    //   ),
    // );
  }

  async handle(
    channel: Prisma.Channel,
    event: any,
    webhookSenderService: WebhookSenderService,
  ): Promise<void> {
    switch (event.type) {
      case 'message':
        await this.handleMessage(channel, event, webhookSenderService);
        break;

      case 'message-event':
        await this.handleMessageEvent(channel, event, webhookSenderService);
        break;

      case 'user-event':
        await this.handleUserEvent(channel, event);
        break;

      case 'system-event':
        await this.handleSystemEvent(channel, event);
        break;
    }
  }

  private async sendHsm(
    channel: Prisma.Channel,
    chat: Prisma.Chat,
    message: CreateMessageDto,
  ): Promise<Prisma.Prisma.MessageUncheckedCreateInput> {
    throw new NotImplementedException();

    // const [, appName, phone] = channel.accountId.split(':');
    // const api = new GupshupClientApi(phone, appName, channel.token);
    // const msg: any = {
    //   type: 'quick_reply',
    // };
    // if (message.text) {
    //   msg.content = {
    //     type: 'text',
    //     text: message.text,
    //   };
    // }
    // if (message.buttons) {
    //   msg.options = message.buttons
    //     .filter((button) => button.type === ButtonType.QuickReply)
    //     .map((button) => ({
    //       type: 'text',
    //       title: button.text,
    //     }));
    // }
    // return {
    //   chatId: chat.id,
    //   externalId: await api.sendMessage(chat.accountId, msg),
    //   fromMe: true,
    //   status: Prisma.MessageStatus.Accepted,
    //   content: {
    //     create: {
    //       text: message.text,
    //       buttons: message.buttons,
    //     },
    //   },
    // };
  }

  private async handleMessage(
    channel: Prisma.Channel,
    event: any,
    webhookSenderService: WebhookSenderService,
  ) {
    const chat = plainToClass(
      Chat,
      await this.prismaService.chat.upsert({
        where: {
          channelId_accountId: {
            channelId: channel.id,
            accountId: event.payload.source,
          },
        },
        create: {
          accountId: event.payload.source,
          contact: {
            create: {
              name: event.payload.sender.name,
              username: event.payload.source,
            },
          },
          channel: {
            connect: {
              id: channel.id,
            },
          },
        },
        update: {
          isNew: false,
        },
        include: {
          contact: true,
        },
      }),
    );

    const message = plainToClass(
      MessageWithChatId,
      await this.prismaService.message.create({
        data: {
          chatId: chat.id,
          fromMe: false,
          status: Prisma.MessageStatus.Delivered,
          content: {
            create: await this.createContent(event),
          },
          externalId: event.payload.id,
        },
        include: {
          chat: {
            select: {
              id: true,
            },
          },
          content: {
            orderBy: {
              id: 'desc',
            },
            take: 1,
            include: {
              attachments: true,
            },
          },
        },
      }),
    );

    await webhookSenderService.dispatchAsync(channel.projectId, {
      type: Prisma.WebhookEventType.IncomingChats,
      payload: {
        ...chat,
        messages: [message],
      },
    });

    await webhookSenderService.dispatchAsync(channel.projectId, {
      type: Prisma.WebhookEventType.IncomingMessages,
      payload: [message],
    });
  }

  private async handleMessageEvent(
    channel: Prisma.Channel,
    event: any,
    webhookSenderService: WebhookSenderService,
  ): Promise<void> {
    const message = await this.prismaService.message.findFirst({
      where: {
        externalId: event.payload.id,
      },
    });

    if (!message) {
      return;
    }

    let status: MessageStatus;
    switch (event.payload.type) {
      case 'enqueued':
        await this.prismaService.message.update({
          where: {
            id: message.id,
          },
          data: {
            externalId: event.payload.payload.whatsappMessageId,
          },
        });
        return;

      case 'delivered':
        status = MessageStatus.Delivered;
        break;

      case 'failed':
        status = MessageStatus.Error;
        break;

      default:
        return;
    }

    await this.prismaService.message.update({
      where: {
        id: message.id,
      },
      data: {
        status,
      },
    });

    // TODO: notify message status changed
  }

  private async handleUserEvent(
    channel: Prisma.Channel,
    event: any,
  ): Promise<void> {
    // TODO: handleUserEvent
  }

  private async handleSystemEvent(
    channel: Prisma.Channel,
    event: any,
  ): Promise<void> {
    // TODO: handleSystemEvent
  }

  private async createContent(
    event: any,
  ): Promise<Omit<Prisma.Prisma.ContentCreateInput, 'message'>> {
    if (event.payload.type) {
      return {
        text: event.payload.payload.text,
      };
    }

    const res = await axios.get(event.payload.payload.url, {
      responseType: 'stream',
    });

    const url = await this.s3Service.upload(res.data);

    switch (event.payload.type) {
      case 'audio':
        return {
          attachments: {
            create: {
              type: Prisma.AttachmentType.Audio,
              url,
            },
          },
        };

      case 'file':
        return {
          attachments: {
            create: {
              type: Prisma.AttachmentType.Document,
              url,
            },
          },
        };

      case 'image':
        return {
          text: event.payload.payload.caption,
          attachments: {
            create: {
              type: Prisma.AttachmentType.Image,
              url,
            },
          },
        };

      case 'video':
        return {
          text: event.payload.payload.caption,
          attachments: {
            create: {
              type: Prisma.AttachmentType.Video,
              url,
            },
          },
        };

      default:
        throw new BadRequestException();
    }
  }
}
