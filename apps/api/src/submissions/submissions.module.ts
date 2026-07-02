import { Module } from "@nestjs/common";
import { SubmissionsController } from "./submissions.controller";
import { SubmissionsService } from "./submissions.service";
import { RolesGuard } from "../auth/guards";

@Module({
  controllers: [SubmissionsController],
  providers: [SubmissionsService, RolesGuard],
})
export class SubmissionsModule {}
