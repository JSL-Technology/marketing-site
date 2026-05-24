import { IsEmail, IsNotEmpty } from 'class-validator';

export class NewsletterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
