import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MessagingGateway } from "./messaging.gateway";

@Module({
  imports: [JwtModule.register({})],
  providers: [MessagingGateway],
  exports: [MessagingGateway],
})
export class MessagingModule {}
