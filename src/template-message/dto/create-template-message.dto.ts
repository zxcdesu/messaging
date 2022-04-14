import { IsOptional, IsString } from 'class-validator';

export class CreateTemplateMessageDto {
  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  text: string;

  @IsString()
  @IsOptional()
  attachments: any;

  @IsString()
  @IsOptional()
  buttons: any;
}
