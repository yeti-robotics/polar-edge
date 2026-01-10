import { type CanActivate, type ExecutionContext, Injectable } from "@nestjs/common";
import type { JwtService } from "@nestjs/jwt";
import type { Request } from "express";

@Injectable()
export class AttendanceTwofaGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    const token = typeof authHeader === "string" ? authHeader.split(" ")[1] : undefined;
    if (!token) {
      return false;
    }
    try {
      await this.jwtService.verifyAsync(token);
      return true;
    } catch {
      return false;
    }
  }
}
