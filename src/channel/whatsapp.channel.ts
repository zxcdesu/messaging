import { GupshupClientApi, GupshupPartnerApi } from '@lb-nest/gupshup-api';
import { NotFoundException } from '@nestjs/common';
import Prisma from '@prisma/client';
import axios from 'axios';
import merge from 'deepmerge';
import { CreateChannelDto } from 'src/channel/dto/create-channel.dto';
import { Channel } from 'src/channel/entities/channel.entity';
import { CreateMessageDto } from 'src/message/dto/create-message.dto';
import { Message } from 'src/message/entities/message.entity';
import { ButtonType } from 'src/message/enums/button-type.enum';
import { AbstractChannel } from './abstract.channel';

export class WhatsappChannel extends AbstractChannel {
  private readonly HANDLERS: Record<
    string,
    (channel: Prisma.Channel, event: any) => Promise<void>
  > = {
    'user-event': this.handleUserEvent.bind(this),
    'message-event': this.handleMessageEvent.bind(this),
    'template-event': this.handleTemplateEvent.bind(this),
    'account-event': this.handleAccountEvent.bind(this),
    message: this.handleMessage.bind(this),
    'billing-event': this.handleBillingEvent.bind(this),
  };

  async create(
    projectId: number,
    createChannelDto: CreateChannelDto,
  ): Promise<Channel> {
    const api = new GupshupPartnerApi(
      this.configService.get<string>('GS_USER'),
      this.configService.get<string>('GS_PASS'),
    );

    const app = await api.appLink(
      createChannelDto.accountId,
      createChannelDto.token,
    );

    const token = await api.getAccessToken(app.id);

    const channel = await this.prismaService.channel.create({
      data: {
        projectId,
        name: createChannelDto.name,
        type: Prisma.ChannelType.Whatsapp,
        accountId: app.id,
        token: {
          token,
          apiKey: createChannelDto.token,
          phone: app.phone,
        },
        status: Prisma.ChannelStatus.Connected,
      },
    });

    await api.toggleAutomatedOptinMessage(token, app.id, false);
    await api.toggleTemplateMessaging(token, app.id, true);
    await api.updateDlrEvents(
      token,
      app.id,
      'ACCOUNT',
      'DELETED',
      'DELIVERED',
      'OTHERS',
      'READ',
      'SENT',
      'TEMPLATE',
    );

    const url = this.configService.get<string>('MESSAGING_URL');
    await api.setCallbackUrl(
      app.id,
      token,
      url.concat(`/channels/${channel.id}/webhook`),
    );

    return channel;
  }

  async send(
    channel: Prisma.Channel,
    chat: Prisma.Chat,
    message: CreateMessageDto,
  ): Promise<Message[]> {
    if (typeof message.hsmId === 'number') {
      return [
        await this.sendHsm(channel, chat, message.hsmId, message.variables),
      ];
    }

    const { phone, apiKey } = channel.token as Record<string, string>;
    const api = new GupshupClientApi(phone, apiKey);

    const messages: Prisma.Prisma.MessageUncheckedCreateInput[] = [];

    if (message.attachments.length > 0) {
      await Promise.all(
        message.attachments.map(async (attachment, i) => {
          const msg: any = {
            [Prisma.AttachmentType.Audio]: {
              type: 'audio',
              url: attachment.url,
            },
            [Prisma.AttachmentType.Document]: {
              type: 'file',
              url: attachment.url,
            },
            [Prisma.AttachmentType.Image]: {
              type: 'image',
              previewUrl: attachment.url,
              originalUrl: attachment.url,
            },
            [Prisma.AttachmentType.Video]: {
              type: 'video',
              url: attachment.url,
            },
          }[attachment.type];

          if (message.text && i === 0) {
            msg.caption = message.buttons.reduce<string>((str, btn) => {
              switch (btn.type) {
                case ButtonType.Phone:
                case ButtonType.Url:
                  return str.concat(` | [${btn.text},${btn.phone || btn.url}]`);

                default:
                  return str.concat(` | [${btn.text}]`);
              }
            }, message.text);
          }

          messages.push({
            projectId: chat.projectId,
            channelId: chat.channelId,
            accountId: chat.accountId,
            externalId: await api.sendMessage(chat.accountId, msg),
            fromMe: true,
            status: Prisma.MessageStatus.Submitted,
            content: {
              create: {
                text: i === 0 ? message.text : undefined,
                attachments: {
                  create: attachment,
                },
                buttons: i === 0 ? (message.buttons as any) : undefined,
              },
            },
          });
        }),
      );
    } else {
      const msg: any = {
        type: 'text',
        text: message.buttons.reduce<string>((str, btn) => {
          switch (btn.type) {
            case ButtonType.Phone:
            case ButtonType.Url:
              return str.concat(` | [${btn.text},${btn.phone || btn.url}]`);

            default:
              return str.concat(` | [${btn.text}]`);
          }
        }, message.text ?? ''),
      };

      messages.push({
        projectId: chat.projectId,
        channelId: chat.channelId,
        accountId: chat.accountId,
        externalId: await api.sendMessage(chat.accountId, msg),
        fromMe: true,
        status: Prisma.MessageStatus.Submitted,
        content: {
          create: {
            text: message.text,
            buttons: message.buttons as any,
          },
        },
      });
    }

    return Promise.all(
      messages.map(async ({ content, externalId }) =>
        super.createMessage(
          chat,
          externalId,
          content,
          Prisma.MessageStatus.Submitted,
          true,
        ),
      ),
    );
  }

  async handle(channel: Prisma.Channel, event: any): Promise<void> {
    return this.HANDLERS[event.type]?.(channel, event);
  }

  private async sendHsm(
    channel: Prisma.Channel,
    chat: Prisma.Chat,
    hsmId: number,
    variables: Record<string, string> = {},
  ): Promise<Message> {
    const api = new GupshupPartnerApi(
      this.configService.get<string>('GS_USER'),
      this.configService.get<string>('GS_PASS'),
    );

    const approval = await this.prismaService.approval.findUniqueOrThrow({
      where: {
        channelId_hsmId: {
          channelId: channel.id,
          hsmId,
        },
      },
      select: {
        hsm: {
          select: {
            text: true,
            attachments: true,
            buttons: true,
          },
        },
        externalId: true,
      },
    });

    if (typeof approval.externalId !== 'string') {
      throw new NotFoundException();
    }

    const { token } = channel.token as Record<string, string>;

    const externalId = await api.sendMessageWithTemplateId(
      token,
      channel.accountId,
      {
        id: approval.externalId,
        params: Object.values(variables),
      },
    );

    return super.createMessage(
      chat,
      externalId,
      {
        create: {
          text: approval.hsm.text,
          attachments: {
            createMany: {
              data: approval.hsm.attachments as Prisma.Attachment,
            },
          },
          buttons: approval.hsm.buttons,
        },
      },
      Prisma.MessageStatus.Submitted,
      true,
    );
  }

  private async handleUserEvent(
    channel: Prisma.Channel,
    event: any,
  ): Promise<void> {
    // TODO: handleUserEvent
  }

  private async handleMessageEvent(
    channel: Prisma.Channel,
    event: any,
  ): Promise<void> {
    const message = await this.prismaService.message.findFirst({
      where: {
        externalId: event.payload.id,
      },
    });

    if (!message) {
      return;
    }

    if (event.payload.type === 'enqueued') {
      await this.prismaService.message.update({
        where: {
          id: message.id,
        },
        data: {
          externalId: event.payload.payload.whatsappMessageId,
        },
      });

      return;
    }

    const status = {
      delivered: Prisma.MessageStatus.Delivered,
      failed: Prisma.MessageStatus.Failed,
    }[event.payload.type];

    if (status) {
      await this.prismaService.message.update({
        where: {
          id: message.id,
        },
        data: {
          status,
        },
      });
    }

    // TODO: notify message status changed
  }

  private async handleTemplateEvent(
    channel: Prisma.Channel,
    event: any,
  ): Promise<void> {
    const templateMessage = await this.prismaService.hsm.findUniqueOrThrow({
      where: {
        projectId_code: {
          projectId: channel.projectId,
          code: event.payload.elementName,
        },
      },
    });

    const status = {
      REJECTED: Prisma.ApprovalStatus.Rejected,
      APPROVED: Prisma.ApprovalStatus.Approved,
      DELETED: undefined,
      DISABLED: undefined,
    }[event.payload.status];

    if (status) {
      await this.prismaService.approval.update({
        where: {
          channelId_hsmId: {
            channelId: channel.id,
            hsmId: templateMessage.id,
          },
        },
        data: {
          status,
          rejectedReason: event.payload.rejectedReason,
        },
      });
    }
  }

  private async handleAccountEvent(
    channel: Prisma.Channel,
    event: any,
  ): Promise<void> {
    // TODO: handleAccountEvent
  }

  private async handleMessage(
    channel: Prisma.Channel,
    event: any,
  ): Promise<void> {
    const chat = await this.createChat(
      channel.projectId,
      channel.id,
      event.payload.source,
    );

    const message = await this.createMessage(
      chat,
      event.payload.id,
      {
        create: await this.createContent(event),
      },
      Prisma.MessageStatus.Submitted,
    );

    this.client.emit('receiveChat', {
      projectId: channel.projectId,
      chat: merge(
        chat,
        {
          contact: {
            name: 'N/A',
          },
          messages: [message],
        },
        {
          arrayMerge: (_, source) => source,
        },
      ),
    });

    this.client.emit('receiveMessage', {
      projectId: channel.projectId,
      message,
    });
  }

  private async handleBillingEvent(
    channel: Prisma.Channel,
    event: any,
  ): Promise<void> {
    // TODO: handleBillingEvent
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
    return {
      audio: {
        attachments: {
          create: {
            type: Prisma.AttachmentType.Audio,
            url,
          },
        },
      },
      file: {
        attachments: {
          create: {
            type: Prisma.AttachmentType.Document,
            url,
          },
        },
      },
      image: {
        text: event.payload.payload.caption,
        attachments: {
          create: {
            type: Prisma.AttachmentType.Image,
            url,
          },
        },
      },
      video: {
        text: event.payload.payload.caption,
        attachments: {
          create: {
            type: Prisma.AttachmentType.Video,
            url,
          },
        },
      },
    }[event.payload.type];
  }
}
