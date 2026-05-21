import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class ContactDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  service: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  message: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  honeypot?: string;

  @IsString()
  @IsNotEmpty()
  recaptchaToken: string;

  @IsString()
  @IsOptional()
  segment?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  budget?: string;

  @IsString()
  @IsOptional()
  leadId?: string;

  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  analytics_event_id?: string;

  @IsString()
  @IsOptional()
  analytics_lead_id?: string;

  @IsString()
  @IsOptional()
  utm_source?: string;

  @IsString()
  @IsOptional()
  utm_medium?: string;

  @IsString()
  @IsOptional()
  utm_campaign?: string;

}
