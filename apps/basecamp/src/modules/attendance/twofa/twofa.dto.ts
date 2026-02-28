import { IsNotEmpty, IsString } from "class-validator";

export class TwofaSignInDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class TwofaValidateDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
