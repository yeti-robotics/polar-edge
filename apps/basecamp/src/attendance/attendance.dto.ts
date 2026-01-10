import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { IntegerOption } from "necord";

export class AttendanceSignInDto {
  @IntegerOption({
    name: "code",
    description: "The code to sign in with",
    required: true,
  })
  code: number;
}

export class AttendanceSignOutDto {
  @IntegerOption({
    name: "code",
    description: "The code to sign out with",
    required: true,
  })
  code: number;
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
