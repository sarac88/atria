import { Module } from "@nestjs/common";
import { ClassesController } from "./classes.controller";
import { ClassesService } from "./classes.service";
import { ClassMembershipGuard, RolesGuard } from "../auth/guards";
import { InvitationsModule } from "../invitations/invitations.module";

@Module({
  imports: [InvitationsModule],
  controllers: [ClassesController],
  providers: [ClassesService, ClassMembershipGuard, RolesGuard],
})
export class ClassesModule {}
