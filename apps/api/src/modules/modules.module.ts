import { Module } from "@nestjs/common";
import { ModulesController } from "./modules.controller";
import { ModulesService } from "./modules.service";
import { LinkPreviewService } from "./link-preview.service";
import { ClassMembershipGuard } from "../auth/guards";

@Module({
  controllers: [ModulesController],
  providers: [ModulesService, LinkPreviewService, ClassMembershipGuard],
})
export class ModulesModule {}
