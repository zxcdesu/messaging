import { IsInt, IsString } from 'class-validator';

export class CreateChatDto {
  @IsInt()
  channelId: number;

  @IsString()
  accountId: string;
}
