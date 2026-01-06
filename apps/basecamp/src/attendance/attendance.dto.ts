import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { NumberOption } from "necord";

export class AttendanceSignInDto {
  @NumberOption({
    name: "code",
    description: "The code to sign in with",
    required: true,
  })
  code?: number;
}

export class AttendanceSignOutDto {
  @NumberOption({
    name: "code",
    description: "The code to sign out with",
    required: true,
  })
  code?: number;
}

export class AttendanceOperationDto {
  @IsString()
  @IsNotEmpty()
  discordId: string;

  @IsString()
  @IsNotEmpty()
  guildId: string;

  @IsString()
  @IsNotEmpty()
  discordName: string;

  @IsNumber()
  code: number;
}
