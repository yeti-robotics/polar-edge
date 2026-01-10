import { IsNotEmpty, IsString } from "class-validator";

export class AttendanceTwofaSignInDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class AttendanceTwofaValidateDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
