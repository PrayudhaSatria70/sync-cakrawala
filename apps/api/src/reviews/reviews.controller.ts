import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, IsArray } from 'class-validator';
import { ReviewsService } from './reviews.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class DecisionDto {
  @IsOptional() @IsString() comment?: string;
}

class ProposalsDto {
  @IsArray()
  proposals: { id: string; value: string }[];
}

@Controller('reviews')
@UseGuards(AuthGuard)
export class ReviewsController {
  constructor(private reviews: ReviewsService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.reviews.list(status);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.reviews.get(id);
  }

  @Patch(':id/proposals')
  updateProposals(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: ProposalsDto) {
    return this.reviews.updateProposals(user, id, dto.proposals);
  }

  @Post(':id/approve')
  approve(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: DecisionDto) {
    return this.reviews.approve(user, id, dto.comment);
  }

  @Post(':id/return')
  returnReview(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: DecisionDto) {
    return this.reviews.returnReview(user, id, dto.comment || 'Returned for revision');
  }

  @Post(':id/reject')
  reject(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: DecisionDto) {
    return this.reviews.reject(user, id, dto.comment || 'Rejected');
  }
}
